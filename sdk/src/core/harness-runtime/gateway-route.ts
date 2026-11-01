import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AgentProtocol } from "../agent-runtime.js";
import {
  startProtocolProxy,
  type BufferedProtocolResponse,
  type ProtocolProxy,
  type ProtocolProxyFailure
} from "../protocol-router.js";
import type { AgentRunRequest, TraceSink } from "../types.js";
import type { HarnessDescriptor } from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import { agentContextWindow, assertInjectionBudget, type InjectionBudget } from "../context-injection-budget.js";

export interface GatewayRouteOptions {
  protocolProxyFactory?: typeof startProtocolProxy;
  /** Inactivity deadline for one provider request on the invocation route. */
  protocolProxyTimeoutMs?: number;
  validateGatewayTarget?: (url: string) => Promise<unknown>;
  bufferedResponseCache?: Map<string, Promise<BufferedProtocolResponse>>;
  onVisibleAssistantDelta?: (text: string) => Promise<void> | void;
  onVisibleReasoningSummaryDelta?: (text: string, itemId: string) => Promise<void> | void;
}

export interface InvocationGatewayRoute {
  baseUrl: string;
  token: string;
  sourceProtocol: AgentProtocol;
  targetProtocol: AgentProtocol;
  proxy: ProtocolProxy;
  getFailure(): ProtocolProxyFailure | undefined;
  resetFailure(): void;
  setInjectionBudget?(prompt: string, extra?: string): void;
  close(): Promise<void>;
}

/** Host-owned profile authority, not a provider endpoint or bearer token. */
export interface NativeCodexProfileBinding {
  nativeCodexProfileHome: string;
  authorityId: string;
}
export type ModelRouteBinding = { baseUrl: string; token: string } | NativeCodexProfileBinding;
export type AdapterModelRoute = (Pick<InvocationGatewayRoute, "baseUrl" | "token" | "sourceProtocol" | "targetProtocol">) | NativeCodexProfileBinding;
export interface InvocationNativeCodexRoute extends NativeCodexProfileBinding {
  /** Native profiles have neither a proxy secret nor a proxy injection hook. */
  token?: never;
  setInjectionBudget?: never;
  getFailure(): undefined;
  resetFailure(): void;
  close(): Promise<void>;
}
export type InvocationModelRoute = InvocationGatewayRoute | InvocationNativeCodexRoute;
export type NativeCodexProfileResolver = (profileId: string) => Promise<string>;

export async function openInvocationModelRoute(
  descriptor: HarnessDescriptor, request: AgentRunRequest, onTrace: TraceSink, signal: AbortSignal,
  options: GatewayRouteOptions, resolveNativeCodexProfile?: NativeCodexProfileResolver
): Promise<InvocationModelRoute> {
  const config = request.project.agents[request.agent];
  if (!config.nativeCodexProfileId) return openInvocationGatewayRoute(descriptor, request, onTrace, signal, options);
  signal.throwIfAborted();
  if (descriptor.route?.nativeProfileAuth !== true || request.purpose === "probe" || request.purpose === "explainer" ||
    config.gatewayId || config.gatewaySnapshot || !resolveNativeCodexProfile) {
    throw new HarnessRuntimeError("HARNESS_CONFIGURATION_INVALID", "Invalid native Codex profile route", { harnessId: descriptor.id });
  }
  const nativeCodexProfileHome = await resolveNativeCodexProfile(config.nativeCodexProfileId);
  if (!path.isAbsolute(nativeCodexProfileHome)) throw new Error("Native Codex profile home must be absolute");
  signal.throwIfAborted();
  await onTrace("status", "Native Codex profile route ready (Codex-owned authentication)", {
    diagnostic: true, diagnosticSource: "runtime", harness: descriptor.id, routeMode: "native-profile"
  });
  return { nativeCodexProfileHome, authorityId: randomUUID(), getFailure: () => undefined,
    resetFailure() {}, async close() {} };
}

export function modelRouteBinding(route: InvocationModelRoute): ModelRouteBinding {
  return "nativeCodexProfileHome" in route
    ? { nativeCodexProfileHome: route.nativeCodexProfileHome, authorityId: route.authorityId }
    : { baseUrl: route.baseUrl, token: route.token };
}

/** Every Harness, including same-protocol invocations, crosses this usage boundary. */
export async function openInvocationGatewayRoute(
  descriptor: HarnessDescriptor,
  request: AgentRunRequest,
  onTrace: TraceSink,
  signal: AbortSignal,
  options: GatewayRouteOptions = {}
): Promise<InvocationGatewayRoute> {
  const gateway = request.project.agents[request.agent].gatewaySnapshot;
  if (!gateway) {
    throw new HarnessRuntimeError(
      "HARNESS_CONFIGURATION_INVALID",
      `${descriptor.label} requires a validated global gateway snapshot`,
      { harnessId: descriptor.id },
      { source: "gateway" }
    );
  }
  const sourceProtocol = descriptor.nativeProtocol as AgentProtocol;
  const targetProtocol = gateway.protocol;
  let proxy: ProtocolProxy;
  let contextBudget: InjectionBudget | undefined;
  try {
    proxy = await (options.protocolProxyFactory ?? startProtocolProxy)({
      sourceProtocol,
      targetProtocol,
      gatewayUrl: gateway.url,
      gatewayApiKey: gateway.apiKey,
      ...(request.gatewayModelFetch ? { modelFetch: request.gatewayModelFetch } : {}),
      webSearchModel: request.project.agents[request.agent].model,
      webSearchEnabled: request.project.agents[request.agent].webSearch === true &&
        request.purpose !== "explainer",
      modelContextWindows: gateway.modelContextWindows,
      getContextInjectionBudget: () => contextBudget,
      gatewayReasoning: gateway.reasoning,
      invocationSignal: signal,
      force: true,
      ...(request.purpose === "probe"
        ? { requiredToolName: "scienceevolve_read_smoke_sentinel" }
        : {}),
      deliveryMode: gateway.deliveryMode ?? "native-stream",
      ...(options.protocolProxyTimeoutMs !== undefined
        ? { timeoutMs: options.protocolProxyTimeoutMs }
        : {}),
      ...(gateway.deliveryMode === "buffered-json" && options.bufferedResponseCache
        ? { bufferedResponseCache: options.bufferedResponseCache }
        : {}),
      ...(options.validateGatewayTarget
        ? { validateGatewayTarget: options.validateGatewayTarget }
        : {}),
      ...(request.onTokenUsage ? { onUsage: request.onTokenUsage } : {}),
      ...(request.onTokenUsagePersistenceFailure
        ? { onUsagePersistenceFailure: request.onTokenUsagePersistenceFailure }
        : {}),
      ...(request.onModelStreamEvent
        ? { onModelStreamEvent: request.onModelStreamEvent }
        : {}),
      ...(options.onVisibleAssistantDelta
        ? { onVisibleAssistantDelta: options.onVisibleAssistantDelta }
        : {}),
      ...(options.onVisibleReasoningSummaryDelta
        ? { onVisibleReasoningSummaryDelta: options.onVisibleReasoningSummaryDelta }
        : {}),
      ...(request.onModelActivity ? { onActivity: request.onModelActivity } : {}),
      onTrace: (kind, message, data) => onTrace(
        kind === "error" ? "stderr" : "status",
        message,
        {
          ...(data ?? {}),
          diagnostic: true,
          diagnosticSource: "proxy",
          harness: descriptor.id,
          routeMode: "proxy"
        }
      )
    });
  } catch (error) {
    if (error instanceof HarnessRuntimeError) throw error;
    throw new HarnessRuntimeError(
      "PROTOCOL_ROUTE_FAILED",
      "Unable to establish the invocation Gateway route",
      { harnessId: descriptor.id },
      { source: "gateway", cause: error instanceof Error ? error : undefined }
    );
  }
  try {
    await onTrace("status", "Invocation gateway route ready", {
      diagnostic: true,
      diagnosticSource: "proxy",
      harness: descriptor.id,
      sourceProtocol,
      targetProtocol,
      routeMode: "proxy",
      routeDirection: `${sourceProtocol}->${targetProtocol}`
    });
  } catch (error) {
    // Ownership transfers to the caller only after this function returns.
    // A trace/storage failure during initialization must therefore close the
    // already-created loopback proxy here.
    await proxy.close().catch(() => undefined);
    throw new HarnessRuntimeError(
      "PROTOCOL_ROUTE_FAILED",
      "Invocation Gateway route initialization could not be recorded",
      { harnessId: descriptor.id },
      { source: "gateway", cause: error instanceof Error ? error : undefined }
    );
  }
  return {
    baseUrl: proxy.baseUrl,
    token: proxy.token,
    sourceProtocol,
    targetProtocol,
    proxy,
    getFailure: () => proxy.getFailure?.(),
    resetFailure: () => proxy.resetFailure?.(),
    setInjectionBudget: (prompt, extra = "") => {
      contextBudget = assertInjectionBudget(prompt, agentContextWindow(request.project.agents[request.agent]), extra);
    },
    close: () => proxy.close()
  };
}
