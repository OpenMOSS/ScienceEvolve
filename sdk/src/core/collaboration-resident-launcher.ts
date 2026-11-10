import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { mcpRevision, startProjectMcps, type ProjectMcpLease } from "./project-mcp.js";
import type {
  CollaborationResidentHandle,
  CollaborationResidentLauncher,
  CollaborationResidentRecoveryResult
} from "./collaboration-runtime.js";
import {
  HarnessRuntimeResidentAdapter,
  ResidentTurnPreparationError
} from "./harness-runtime/resident-runtime-adapter.js";
import { readResidentMarker, residentScopeId, type ResidentProcessLease, type ResidentUnstartedSessionGrant } from "./harness-runtime/resident-lease.js";
import { HarnessRuntimeFacade } from "./harness-runtime/runtime.js";
import { createResidentRecoveryProofSeed } from "./recovery-proof.js";
import type {
  AgentRunResult,
  GroupRun,
  MemberExecution,
  ProjectState,
  ResidentDurableRehydrateProvenance,
  ResidentRecoveryProofSeed,
  ResidentRecoverySessionIdentity
} from "./types.js";

interface ClosedScopeProof {
  epoch: number;
  runtimePath: string;
  session?: ResidentRecoverySessionIdentity;
  acknowledgedControlSeq: number;
  observedAt: string;
  inputStarted?: boolean;
  workspacePath?: string;
  projectId?: string;
  agentId?: string;
  role?: ResidentProcessLease["role"];
}

/**
 * Production I/H composition. The coordinator owns S epochs and request
 * construction; this boundary owns native PGID reconciliation and the real
 * stable-frontdoor Harness adapter.
 */
export function createProductionCollaborationResidentLauncher(
  runtime: HarnessRuntimeFacade,
  adapter: HarnessRuntimeResidentAdapter
): CollaborationResidentLauncher {
  const knownScopes = new Set<string>();
  const stopConfirmedScopes = new Map<string, ClosedScopeProof>();
  const rememberUnstartedStop = (scope: string, epoch: number, runtimePath: string,
    state: ProjectState, agentId: string, previous?: ResidentProcessLease) => {
    if (previous?.executionId !== scope || previous.ownershipEpoch !== epoch ||
      previous.inputStarted !== false || !previous.workspacePath) return;
    stopConfirmedScopes.set(scope, { epoch, runtimePath, projectId: state.id, agentId, role: previous.role,
      session: structuredClone(previous.session), inputStarted: false, workspacePath: previous.workspacePath,
      acknowledgedControlSeq: previous.acknowledgedControlSeq, observedAt: new Date().toISOString() });
  };

  const trackedOpen: CollaborationResidentLauncher["open"] = async (input) => {
    const context = input.request.executionContext!;
    const scope = residentScopeId(context);
    const scopeEpoch = context.role === "leader" ? context.coordinatorEpoch : context.ownershipEpoch;
    // This is a retained receipt turn, not a new delivery. Keep the user's
    // configured business capabilities intact and allocate only its mechanism.
    const mechanismOnly = input.request.terminalPushObservation !== undefined || input.request.terminalPushCoordination !== undefined || input.request.worktreeClosing !== undefined;
    const baseRequest = mechanismOnly
      ? { ...input.request, permission: "workspace" as const }
      : input.request;
    let activeSubmitInvocationId: string | undefined;
    let experimentWaitInvocationId: string | undefined;
    const trackExperimentWait = (request: typeof baseRequest): typeof baseRequest => {
      const previous = request.onExperimentWait;
      const previousRecovery = request.onHarnessRecoveryWait;
      const trackWait = (previous: typeof request.onExperimentWait) => async (waiting: boolean) => {
        if (activeSubmitInvocationId !== request.invocationId) {
          throw new Error("Experiment wait lost its original native submit");
        }
        // Mark the physical safe point before the coordinator releases its
        // activity count and can call this handle's Pause.
        if (waiting) experimentWaitInvocationId = request.invocationId;
        await previous?.(waiting);
        // The coordinator may hold this result behind Pause. Keep its safe
        // point until that original continuation is actually authorized.
        if (!waiting && experimentWaitInvocationId === request.invocationId) {
          experimentWaitInvocationId = undefined;
        }
      };
      return { ...request, onExperimentWait: trackWait(previous), onHarnessRecoveryWait: trackWait(previousRecovery) };
    };
    const selected = (mechanismOnly ? [] : baseRequest.project.agents[baseRequest.agent]?.mcpServers ?? [])
      .filter((server) => server.project !== undefined);
    const mcpController = new AbortController();
    const signal = AbortSignal.any([input.signal, mcpController.signal]);
    let projectMcps: ProjectMcpLease | undefined;
    if (selected.length) {
      projectMcps = await startProjectMcps({
        definitions: baseRequest.project.mcpDefinitions,
        servers: baseRequest.project.agents[baseRequest.agent].mcpServers,
        projectPath: baseRequest.projectPath,
        workspacePath: baseRequest.workspacePath,
        runtimePath: baseRequest.runtimePath,
        signal,
        onFailure: (error) => mcpController.abort(error)
      });
    }
    const resolveRequest = (request: typeof baseRequest): typeof baseRequest => {
      if (!projectMcps) return request;
      if (!isDeepStrictEqual(request.project.agents[request.agent].mcpServers,
        baseRequest.project.agents[baseRequest.agent].mcpServers) || selected.some((server) => {
        const name = server.project!;
        const before = baseRequest.project.mcpDefinitions?.[name];
        const after = request.project.mcpDefinitions?.[name];
        return !before || !after || mcpRevision(before) !== mcpRevision(after);
      })) {
        throw new Error("Resident project MCP configuration changed during a live scope");
      }
      const project = structuredClone(request.project);
      project.agents[request.agent].mcpServers = structuredClone(projectMcps.servers);
      return { ...request, project,
        ...(context.role === "leader" ? { workflowContext: {
          ...(request.workflowContext ?? { scope: input.controlScope?.role === "scoped-main" || "routeScopeId" in context ? "global" as const : "group" as const,
            ...(context.groupRunId ? { groupRunId: context.groupRunId } : {}) }),
          configuredMcpServers: structuredClone(request.project.agents[request.agent].mcpServers)
        } } : {}) };
    };
    let opened: Awaited<ReturnType<HarnessRuntimeResidentAdapter["open"]>>;
    let grantActive = true;
    try {
      let sameEpochReopen = input.sameEpochReopen;
      if (sameEpochReopen) {
        const grant = sameEpochReopen;
        if (context.role !== "delivery" || baseRequest.project.orchestration.schemaVersion !== 3 ||
          grant.previousRuntimePath === input.executionRuntimePath) {
          throw new Error("Scoped supplemental open requires a distinct original delivery runtime");
        }
        const harnessId = requiredHarness(baseRequest.project, baseRequest.agent);
        let physicalStopChecked = false;
        sameEpochReopen = { previousRuntimePath: grant.previousRuntimePath, revalidate: async () => {
          signal.throwIfAborted();
          await grant.revalidate();
          if (!physicalStopChecked) {
            // S has already accepted this precise old turn's Stop proof. I
            // fences its original runtime and scans the exact native claim
            // again; no business work, Git action or budget is performed here.
            await runtime.cleanupResidentInterrupted({ projectId: baseRequest.project.id, harnessId,
              scopeId: scope, role: "delivery", executionId: context.executionId,
              ownershipEpoch: context.ownershipEpoch }, grant.previousRuntimePath, { allowMissingClaim: true });
            physicalStopChecked = true;
          }
          signal.throwIfAborted();
          await grant.revalidate();
        } };
        await sameEpochReopen.revalidate();
      }
      // A new launch attempt may create a process even if publication fails.
      // The preceding handle's close proof can never certify that new process.
      const prior = stopConfirmedScopes.get(scope);
      const harnessId = requiredHarness(baseRequest.project, baseRequest.agent);
      let unstartedSession: ResidentUnstartedSessionGrant | undefined;
      if (prior?.inputStarted === false && prior.session?.harnessId === harnessId &&
        prior.projectId === baseRequest.project.id && prior.agentId === baseRequest.agent &&
        prior.role === context.role && prior.workspacePath === baseRequest.workspacePath &&
        prior.runtimePath !== input.executionRuntimePath &&
        prior.epoch === (sameEpochReopen ? scopeEpoch : scopeEpoch - 1)) {
        unstartedSession = { projectId: prior.projectId, scopeId: scope, role: context.role,
          stoppedEpoch: prior.epoch, workspacePath: prior.workspacePath, session: structuredClone(prior.session),
          revalidate: async () => {
            signal.throwIfAborted();
            if (!grantActive) throw new Error("Unstarted Session grant is no longer part of this launch");
            const marker = await readResidentMarker(prior.runtimePath);
            if (!marker || marker.executionId !== scope || marker.harnessId !== harnessId ||
              marker.role !== context.role || marker.ownershipEpoch !== prior.epoch ||
              marker.inputStarted !== false || marker.workspacePath !== prior.workspacePath ||
              !["stopped", "crashed"].includes(marker.state) || !isDeepStrictEqual(marker.session, prior.session)) {
              throw new Error("Unstarted Session no longer matches its exact stopped never-input marker");
            }
            // Only before native spawn: repeat the existing exact old-epoch
            // claim scan, without reconciling or terminating the new lease.
            await runtime.cleanupResidentInterrupted(context.role === "leader"
              ? { projectId: prior.projectId!, harnessId, scopeId: scope, role: "leader", coordinatorEpoch: prior.epoch }
              : { projectId: prior.projectId!, harnessId, scopeId: scope, role: context.role,
                executionId: scope, ownershipEpoch: prior.epoch }, prior.runtimePath);
            signal.throwIfAborted();
          } };
      }
      stopConfirmedScopes.delete(scope);
      opened = await adapter.open({
        ...input,
        ...(sameEpochReopen ? { sameEpochReopen } : {}),
        ...(unstartedSession ? { unstartedSession } : {}),
        request: trackExperimentWait(resolveRequest(baseRequest)),
        signal,
        ...(input.turnRequestFactory ? {
          turnRequestFactory: async (turnInput) => {
            const runtime = await input.turnRequestFactory!({ ...turnInput, baseRequest });
            return { ...runtime, request: trackExperimentWait(resolveRequest(runtime.request)) };
          }
        } : {})
      });
    } catch (error) {
      await projectMcps?.close().catch(() => undefined);
      throw error;
    } finally {
      grantActive = false;
    }
    try {
      await input.request.onResidentNativeOpened?.({ runtimePath: input.executionRuntimePath, session: opened.initialLease.session });
      await input.onOpened?.();
    } catch (error) {
      await opened.close().catch(() => undefined);
      await projectMcps?.close().catch(() => undefined);
      throw error;
    }
    // A successfully opened process is new live authority. Any close proof
    // retained for an older handle/scope is no longer admissible.
    stopConfirmedScopes.delete(scope);
    knownScopes.add(scope);
    let closed = false;
    let closing: Promise<void> | undefined;
    let activeSubmit: Promise<AgentRunResult> | undefined;
    let nativeTurnFailed = false;
    let closeRequested = false;
    const handle: CollaborationResidentHandle = {
      get closed() { return closed; },
      supervisionActions: () => opened.supervisionActions?.() ?? Promise.resolve([]),
      submit: async (turn) => {
        activeSubmitInvocationId = turn.invocationId;
        const operation = opened.submit(turn);
        activeSubmit = operation;
        try { return await operation; }
        catch (error) {
          if (error instanceof ResidentTurnPreparationError) throw error.cause;
          nativeTurnFailed = true;
          // A failed native turn can leave a crashed lease. Complete its
          // existing shutdown before the caller releases its active-turn
          // fence; otherwise a queued Pause races close and tries to suspend
          // the crashed process instead of observing the confirmed stop.
          await handle.close();
          throw error;
        }
        finally {
          if (activeSubmit === operation) {
            activeSubmit = undefined;
            activeSubmitInvocationId = undefined;
            experimentWaitInvocationId = undefined;
          }
        }
      },
      pause: async () => {
        const operation = activeSubmit;
        if (operation && (!experimentWaitInvocationId || experimentWaitInvocationId !== activeSubmitInvocationId)) {
          try {
            await operation;
          } catch (error) {
            // The submit path owns closing a failed native turn. If this
            // continuation wins the rejection race, join that same close
            // before attempting a native Pause.
            if (!(error instanceof ResidentTurnPreparationError)) {
              await handle.close();
              return;
            }
          }
        }
        // A rejected close clears its in-flight promise so it can be retried.
        // Keep the native failure after submit settles: a later Pause still
        // needs exact stop confirmation, not a control call on the crashed lease.
        if (nativeTurnFailed || closeRequested) {
          await handle.close();
          return;
        }
        await opened.pause();
      },
      resume: async () => {
        if (nativeTurnFailed || closeRequested) { await handle.close(); return; }
        if (!closed) await opened.resume();
      },
      close: async () => {
        if (closed) return;
        closeRequested = true;
        closing ??= (async () => {
          const observedLease = await opened.probe().catch(() => undefined);
          const finalLease = observedLease ?? opened.initialLease;
          await opened.close();
          await projectMcps?.close();
          closed = true;
          stopConfirmedScopes.set(scope, {
            epoch: scopeEpoch,
            runtimePath: input.executionRuntimePath,
            session: structuredClone(finalLease.session),
            acknowledgedControlSeq: finalLease.acknowledgedControlSeq,
            // A failed probe's initial lease cannot prove no input occurred.
            ...(observedLease ? { inputStarted: observedLease.inputStarted,
              workspacePath: observedLease.workspacePath } : {}),
            projectId: baseRequest.project.id, agentId: baseRequest.agent, role: context.role,
            observedAt: new Date().toISOString()
          });
        })().catch((error) => {
          closing = undefined;
          throw error;
        });
        await closing;
      }
    };
    return handle;
  };

  return {
    open: trackedOpen,

    async stopScopedForRecovery(input) {
      if (input.state.orchestration.schemaVersion !== 3) throw new Error("Scoped process recovery requires a v3 project");
      const harnessId = requiredHarness(input.state, input.agentId);
      const cached = stopConfirmedScopes.get(input.scopeId);
      if (cached?.epoch !== input.ownershipEpoch || cached.runtimePath !== input.executionRuntimePath) {
        const reconciliation = await runtime.reconcileResidentStartup({ executionId: input.scopeId, harnessId,
          runtimePath: input.executionRuntimePath, nextOwnershipEpoch: input.ownershipEpoch + 1 });
        if (!reconciliationProvesStop(reconciliation, input.ownershipEpoch)) {
          await runtime.cleanupResidentInterrupted(input.role === "leader"
            ? { projectId: input.state.id, harnessId, scopeId: input.scopeId, role: "leader", coordinatorEpoch: input.ownershipEpoch }
            : { projectId: input.state.id, harnessId, scopeId: input.scopeId, role: "delivery", executionId: input.scopeId, ownershipEpoch: input.ownershipEpoch }, input.executionRuntimePath,
            { allowMissingClaim: true });
        }
        rememberUnstartedStop(input.scopeId, input.ownershipEpoch, input.executionRuntimePath,
          input.state, input.agentId, reconciliation.previous);
      }
      return { stopped: true, evidence: { protocol: "scoped-supervisor-stop-v1", projectId: input.state.id,
        scopeId: input.scopeId, agentId: input.agentId, role: input.role, ownershipEpoch: input.ownershipEpoch,
        runtimePath: input.executionRuntimePath, nativeProcessScanCleared: true } };
    },

    async stopForRecovery(input) {
      const harnessId = requiredHarness(input.state, input.execution.agentId);
      const cached = stopConfirmedScopes.get(input.execution.id);
      const durableRequired = runtime.residentRecoveryStrategy(harnessId, input.state.orchestration?.schemaVersion) === "durable-rehydrate";
      if (cached?.epoch === input.execution.ownershipEpoch) {
        return recoveryResult({
          stopped: true,
          durableRequired,
          state: input.state,
          scope: "member",
          sourceNodeRunId: input.execution.nodeRunId,
          scopeId: input.execution.id,
          agentId: input.execution.agentId,
          stoppedEpoch: input.execution.ownershipEpoch,
          oldSession: cached.session,
          observedAt: cached.observedAt,
          lastBusinessTurn: cached.acknowledgedControlSeq,
          lastInputId: `execution:${input.execution.id}:epoch:${input.execution.ownershipEpoch}`,
          transcript: executionRecoveryTranscript(input.execution),
          evidence: { runtimeOutcome: "closed-in-process", markerObserved: true }
        });
      }
      const reconciliation = await runtime.reconcileResidentStartup({
        executionId: input.execution.id,
        harnessId,
        runtimePath: input.executionRuntimePath,
        nextOwnershipEpoch: input.execution.ownershipEpoch + 1
      });
      let stopped = reconciliationProvesStop(
        reconciliation,
        input.execution.ownershipEpoch
      );
      let residentProcessScanCleared = false;
      if (!stopped) {
        // `execution.launch.started` is committed before adapter.open. A crash
        // in that gap has no resident marker, so resident reconciliation alone
        // returns `none`. The process host's exact resident authority scan is
        // the stronger absence/termination proof: it kills every matching
        // process group and rescans to zero.
        await runtime.cleanupResidentInterrupted(
          {
            projectId: input.state.id,
            harnessId,
            scopeId: input.execution.id,
            role: input.execution.purpose,
            executionId: input.execution.id,
            ownershipEpoch: input.execution.ownershipEpoch
          },
          input.executionRuntimePath,
          { allowMissingClaim: input.residentLaunchProtocol === "trusted-supervisor-v1" }
        );
        stopped = true;
        residentProcessScanCleared = true;
      }
      rememberUnstartedStop(input.execution.id, input.execution.ownershipEpoch, input.executionRuntimePath,
        input.state, input.execution.agentId, reconciliation.previous);
      return recoveryResult({
        // `none`, `dead`, and `identity-mismatch` do not by themselves prove
        // that the old process group has no surviving children.
        stopped,
        durableRequired,
        state: input.state,
        scope: "member",
        sourceNodeRunId: input.execution.nodeRunId,
        scopeId: input.execution.id,
        agentId: input.execution.agentId,
        stoppedEpoch: input.execution.ownershipEpoch,
        oldSession: reconciliation.previous?.session ?? persistedSession(
          input.state,
          input.execution.agentId,
          input.execution.purpose,
          input.execution.id
        ),
        observedAt: new Date().toISOString(),
        lastBusinessTurn: reconciliation.previous?.acknowledgedControlSeq ?? 0,
        lastInputId: `execution:${input.execution.id}:epoch:${input.execution.ownershipEpoch}`,
        transcript: executionRecoveryTranscript(input.execution),
        evidence: {
          ...reconciliationEvidence(reconciliation),
          ...(residentProcessScanCleared ? { residentProcessScanCleared: true } : {})
        }
      });
    },

    async stopLeaderForRecovery(input) {
      const coordinator = input.groupRun.actingCoordinatorId ?? input.groupRun.leaderAgentId;
      const harnessId = requiredHarness(input.state, coordinator);
      const scope = `management:${input.nodeRunId}:${input.groupRun.id}`;
      const cached = stopConfirmedScopes.get(scope);
      const durableRequired = runtime.residentRecoveryStrategy(harnessId, input.state.orchestration?.schemaVersion) === "durable-rehydrate";
      if (cached?.epoch === input.groupRun.coordinatorEpoch) {
        return recoveryResult({
          stopped: true,
          durableRequired,
          state: input.state,
          scope: "group-leader",
          sourceNodeRunId: input.nodeRunId,
          scopeId: input.groupRun.id,
          agentId: coordinator,
          stoppedEpoch: input.groupRun.coordinatorEpoch,
          oldSession: cached.session,
          observedAt: cached.observedAt,
          lastBusinessTurn: cached.acknowledgedControlSeq,
          lastInputId: `group:${input.groupRun.id}:epoch:${input.groupRun.coordinatorEpoch}`,
          transcript: groupRecoveryTranscript(input.groupRun),
          evidence: { runtimeOutcome: "closed-in-process", markerObserved: true }
        });
      }
      const reconciliation = await runtime.reconcileResidentStartup({
        executionId: scope,
        harnessId,
        runtimePath: input.executionRuntimePath,
        nextOwnershipEpoch: input.groupRun.coordinatorEpoch + 1
      });
      let stopped = reconciliationProvesStop(
        reconciliation,
        input.groupRun.coordinatorEpoch
      );
      let residentProcessScanCleared = false;
      if (!stopped) {
        // An exact resident scope/role/coordinator-epoch process scan spans
        // the DB claim -> durable marker gap without relying on per-turn ids.
        await runtime.cleanupResidentInterrupted(
          {
            projectId: input.state.id,
            harnessId,
            scopeId: scope,
            role: "leader",
            coordinatorEpoch: input.groupRun.coordinatorEpoch
          },
          input.executionRuntimePath,
          { allowMissingClaim: input.residentLaunchProtocol === "trusted-supervisor-v1" }
        );
        stopped = true;
        residentProcessScanCleared = true;
      }
      rememberUnstartedStop(scope, input.groupRun.coordinatorEpoch, input.executionRuntimePath,
        input.state, coordinator, reconciliation.previous);
      return recoveryResult({
        stopped,
        durableRequired,
        state: input.state,
        scope: "group-leader",
        sourceNodeRunId: input.nodeRunId,
        scopeId: input.groupRun.id,
        agentId: coordinator,
        stoppedEpoch: input.groupRun.coordinatorEpoch,
        oldSession: reconciliation.previous?.session ?? persistedSession(
          input.state,
          coordinator,
          "leader",
          input.groupRun.id
        ),
        observedAt: new Date().toISOString(),
        lastBusinessTurn: reconciliation.previous?.acknowledgedControlSeq ?? 0,
        lastInputId: `group:${input.groupRun.id}:epoch:${input.groupRun.coordinatorEpoch}`,
        transcript: groupRecoveryTranscript(input.groupRun),
        evidence: {
          ...reconciliationEvidence(reconciliation),
          ...(residentProcessScanCleared ? { residentProcessScanCleared: true } : {})
        }
      });
    },

    async decideRoute(input) {
      const context = input.open.request.executionContext!;
      const scope = residentScopeId(context);
      const harnessId = requiredHarness(input.state, "main");
      const epoch = context.role === "leader"
        ? context.coordinatorEpoch
        : context.ownershipEpoch;
      const cachedPriorStop = stopConfirmedScopes.get(scope)?.epoch === epoch - 1;
      if (!cachedPriorStop && (!knownScopes.has(scope) || epoch > 1)) {
        const reconciliation = await runtime.reconcileResidentStartup({
          executionId: scope,
          harnessId,
          runtimePath: input.open.executionRuntimePath,
          nextOwnershipEpoch: epoch
        });
        // Attempt one is the only pre-launch state with no possible older
        // writer. Every later attempt requires either a terminated PGID or a
        // same-epoch durable stopped marker before a new Main can open.
        if (epoch > 1 && !reconciliationProvesStop(reconciliation, epoch - 1)) {
          throw new Error("Main route resident lacks prior process stop proof");
        }
      }
      const handle = await trackedOpen(input.open);
      try {
        input.register?.(handle);
        const submit = input.submit ?? ((resident, turn) => resident.submit(turn));
        let turn = input.turn;
        let result = await submit(handle, turn);
        const controlActions = [...(result.controlActions ?? [])];
        while (input.onTurnCompleted) {
          const next = await input.onTurnCompleted(result, turn);
          if (!next) break;
          turn = next;
          result = await submit(handle, turn);
          controlActions.push(...(result.controlActions ?? []));
        }
        result = { ...result, ...(controlActions.length ? { controlActions } : {}) };
        const decision = result.controlActions?.find((envelope) =>
          envelope.action.tool === "route_to_agent" ||
          envelope.action.tool === "complete_project" ||
          envelope.action.tool === "request_user" ||
          envelope.action.tool === "apply_workflow"
        );
        if (!decision) {
          return {
            decisionRecorded: false,
            ...(result.handoff?.trim() ? { output: result.handoff.trim() } : {}),
            ...(result.controlActions?.length
              ? { controlActions: result.controlActions }
              : {})
          };
        }
        const action = decision.action;
        if (action.tool !== "route_to_agent" && action.tool !== "complete_project" &&
          action.tool !== "request_user" && action.tool !== "apply_workflow") {
          throw new Error("Main route resident returned an invalid orchestration decision");
        }
        if (action.tool === "request_user") {
          return {
            decisionRecorded: true,
            targetNodeId: "user",
            decisionRequestId: decision.callId,
            ...(result.handoff?.trim() ? { output: result.handoff.trim() } : {}),
            intervention: action,
            decisionAction: action,
            controlActions: result.controlActions
          };
        }
        if (action.tool === "apply_workflow") {
          return {
            decisionRecorded: true,
            // apply_workflow is handled before route validation by the
            // system-Main runtime. This sentinel can never be emitted as an
            // outer route target.
            targetNodeId: "__apply_workflow__",
            decisionRequestId: decision.callId,
            ...(result.handoff?.trim() ? { output: result.handoff.trim() } : {}),
            decisionAction: action,
            controlActions: result.controlActions
          };
        }
        const targetNodeId = action.tool === "complete_project" ? "finish" : action.target;
        if (!input.candidates.includes(targetNodeId)) {
          throw new Error("Main route resident selected a non-candidate target");
        }
        return {
          decisionRecorded: true,
          targetNodeId,
          decisionRequestId: decision.callId,
          ...(result.handoff?.trim() ? { output: result.handoff.trim() } : {}),
          decisionAction: action,
          controlActions: result.controlActions
        };
      } finally {
        await handle.close();
        input.unregister?.(handle);
      }
    },

    async observeMainRecovery(input) {
      const coordinator = input.groupRun.actingCoordinatorId ?? input.groupRun.leaderAgentId;
      const harnessId = requiredHarness(input.state, coordinator);
      const scope = `management:${input.groupRun.nodeRunId}:${input.groupRun.id}`;
      const cached = stopConfirmedScopes.get(scope);
      const durableRequired = runtime.residentRecoveryStrategy(harnessId, input.state.orchestration?.schemaVersion) === "durable-rehydrate";
      if (cached?.epoch === input.groupRun.coordinatorEpoch) {
        return recoveryResult({
          stopped: true,
          durableRequired,
          state: input.state,
          scope: "group-leader",
          sourceNodeRunId: input.groupRun.nodeRunId,
          scopeId: input.groupRun.id,
          agentId: coordinator,
          stoppedEpoch: input.groupRun.coordinatorEpoch,
          oldSession: cached.session,
          observedAt: cached.observedAt,
          lastBusinessTurn: cached.acknowledgedControlSeq,
          lastInputId: `group:${input.groupRun.id}:epoch:${input.groupRun.coordinatorEpoch}`,
          transcript: groupRecoveryTranscript(input.groupRun),
          evidence: { runtimeOutcome: "closed-in-process", markerObserved: true }
        });
      }
      try {
        const reconciliation = await runtime.reconcileResidentStartup({
          executionId: scope,
          harnessId,
          runtimePath: input.executionRuntimePath,
          nextOwnershipEpoch: input.groupRun.coordinatorEpoch + 1
        });
        return recoveryResult({
          stopped: reconciliationProvesStop(
            reconciliation,
            input.groupRun.coordinatorEpoch
          ),
          durableRequired,
          state: input.state,
          scope: "group-leader",
          sourceNodeRunId: input.groupRun.nodeRunId,
          scopeId: input.groupRun.id,
          agentId: coordinator,
          stoppedEpoch: input.groupRun.coordinatorEpoch,
          oldSession: reconciliation.previous?.session ?? persistedSession(
            input.state,
            coordinator,
            "leader",
            input.groupRun.id
          ),
          observedAt: new Date().toISOString(),
          lastBusinessTurn: reconciliation.previous?.acknowledgedControlSeq ?? 0,
          lastInputId: `group:${input.groupRun.id}:epoch:${input.groupRun.coordinatorEpoch}`,
          transcript: groupRecoveryTranscript(input.groupRun),
          evidence: reconciliationEvidence(reconciliation)
        });
      } catch {
        return { stopped: false, evidence: { runtimeOutcome: "observation-failed" } };
      }
    },

    async observeMainRouteRecovery(input) {
      const harnessId = requiredHarness(input.state, "main");
      const scope = `management:${input.sourceNodeRunId}:${input.routeScopeId}`;
      const cached = stopConfirmedScopes.get(scope);
      const durableRequired = runtime.residentRecoveryStrategy(harnessId, input.state.orchestration?.schemaVersion) === "durable-rehydrate";
      if (cached?.epoch === input.routeEpoch) {
        return recoveryResult({
          stopped: true,
          durableRequired,
          state: input.state,
          scope: "main-route",
          sourceNodeRunId: input.sourceNodeRunId,
          scopeId: input.routeScopeId,
          agentId: "main",
          stoppedEpoch: input.routeEpoch,
          oldSession: cached.session,
          observedAt: cached.observedAt,
          lastBusinessTurn: cached.acknowledgedControlSeq,
          lastInputId: `input-main-route-${input.sourceNodeRunId}-${input.routeEpoch}`,
          transcript: mainRouteRecoveryTranscript(input),
          evidence: { runtimeOutcome: "closed-in-process", markerObserved: true }
        });
      }
      try {
        const reconciliation = await runtime.reconcileResidentStartup({
          executionId: scope,
          harnessId,
          runtimePath: input.executionRuntimePath,
          nextOwnershipEpoch: input.routeEpoch + 1
        });
        let stopped = reconciliationProvesStop(
          reconciliation,
          input.routeEpoch
        );
        let residentProcessScanCleared = false;
        if (!stopped) {
          // main.route.attempt is the durable trusted launch claim. A failure
          // while compiling authority can happen before the resident writes
          // its own marker, so reconcileResidentStartup legitimately returns
          // `none`. Prove absence with the same exact scope/epoch process scan
          // used for delivery and group-leader recovery before unfreezing S.
          await runtime.cleanupResidentInterrupted(
            {
              projectId: input.state.id,
              harnessId,
              scopeId: scope,
              role: "leader",
              coordinatorEpoch: input.routeEpoch
            },
            input.executionRuntimePath,
            { allowMissingClaim: true }
          );
          stopped = true;
          residentProcessScanCleared = true;
        }
        // The immediately following recovered attempt runs in this launcher
        // instance. Preserve the exact epoch proof so decideRoute does not
        // demand a second marker from a process that never reached open().
        const oldSession = reconciliation.previous?.session ?? persistedSession(
          input.state,
          "main",
          "leader",
          input.routeScopeId
        );
        if (stopped) {
          stopConfirmedScopes.set(scope, {
            epoch: input.routeEpoch,
            runtimePath: input.executionRuntimePath,
            ...(oldSession ? { session: structuredClone(oldSession) } : {}),
            acknowledgedControlSeq: reconciliation.previous?.acknowledgedControlSeq ?? 0,
            observedAt: new Date().toISOString()
          });
        }
        return recoveryResult({
          stopped,
          durableRequired,
          state: input.state,
          scope: "main-route",
          sourceNodeRunId: input.sourceNodeRunId,
          scopeId: input.routeScopeId,
          agentId: "main",
          stoppedEpoch: input.routeEpoch,
          oldSession,
          observedAt: new Date().toISOString(),
          lastBusinessTurn: reconciliation.previous?.acknowledgedControlSeq ?? 0,
          lastInputId: `input-main-route-${input.sourceNodeRunId}-${input.routeEpoch}`,
          transcript: mainRouteRecoveryTranscript(input),
          evidence: {
            ...reconciliationEvidence(reconciliation),
            ...(residentProcessScanCleared ? { residentProcessScanCleared: true } : {})
          }
        });
      } catch {
        return { stopped: false, evidence: { runtimeOutcome: "observation-failed" } };
      }
    }
  };
}

function reconciliationProvesStop(
  reconciliation: Awaited<ReturnType<HarnessRuntimeFacade["reconcileResidentStartup"]>>,
  expectedOwnershipEpoch: number
): boolean {
  return reconciliation.outcome === "terminated" ||
    reconciliation.previous?.state === "stopped" &&
    reconciliation.previous.ownershipEpoch === expectedOwnershipEpoch;
}

function requiredHarness(state: ProjectState, agentId: string) {
  const harness = state.agents[agentId]?.harness;
  if (!harness) throw new Error(`Agent ${agentId} has no locked resident Harness`);
  return harness;
}

function reconciliationEvidence(
  reconciliation: Awaited<ReturnType<HarnessRuntimeFacade["reconcileResidentStartup"]>>
): Readonly<Record<string, unknown>> {
  return {
    runtimeOutcome: reconciliation.outcome,
    markerObserved: reconciliation.previous !== undefined,
    ...(reconciliation.previous ? {
      priorOwnershipEpoch: reconciliation.previous.ownershipEpoch,
      priorState: reconciliation.previous.state,
      priorProcessGroupId: reconciliation.previous.processGroupId ?? reconciliation.previous.pid
    } : {})
  };
}

function recoveryResult(input: {
  stopped: boolean;
  durableRequired: boolean;
  state: ProjectState;
  scope: ResidentRecoveryProofSeed["scope"];
  sourceNodeRunId: string;
  scopeId: string;
  agentId: string;
  stoppedEpoch: number;
  oldSession?: ResidentRecoverySessionIdentity;
  observedAt: string;
  lastBusinessTurn: number;
  lastInputId: string;
  transcript: string;
  evidence: Readonly<Record<string, unknown>>;
}): CollaborationResidentRecoveryResult {
  if (!input.stopped) return { stopped: false, evidence: input.evidence };
  if (!input.oldSession) {
    // A failed first launch has no session to rehydrate after an exact stop scan.
    if (input.evidence.runtimeOutcome === "none" &&
      input.evidence.residentProcessScanCleared === true && input.lastBusinessTurn === 0) {
      return { stopped: true, evidence: { ...input.evidence, sessionNotPreviouslyCommitted: true } };
    }
    return input.durableRequired
      ? {
          stopped: false,
          evidence: {
            ...input.evidence,
            recoveryRejected: "old-session-unavailable"
          }
        }
      : { stopped: true, evidence: input.evidence };
  }
  const durableRehydrate: ResidentDurableRehydrateProvenance | undefined =
    input.durableRequired
      ? {
          sourceDigest: createHash("sha256").update(input.transcript).digest("hex"),
          lastBusinessTurn: input.lastBusinessTurn,
          lastInputId: input.lastInputId,
          transcript: input.transcript
        }
      : undefined;
  return {
    stopped: true,
    evidence: input.evidence,
    recovery: createResidentRecoveryProofSeed({
      scope: input.scope,
      projectId: input.state.id,
      sourceNodeRunId: input.sourceNodeRunId,
      scopeId: input.scopeId,
      agentId: input.agentId,
      stoppedEpoch: input.stoppedEpoch,
      oldSession: input.oldSession,
      observedAt: input.observedAt,
      evidence: input.evidence,
      ...(durableRehydrate ? { durableRehydrate } : {})
    })
  };
}

function persistedSession(
  state: ProjectState,
  agentId: string,
  role: "leader" | MemberExecution["purpose"],
  scopeId: string
): ResidentRecoverySessionIdentity | undefined {
  if (state.orchestration?.schemaVersion === 3) return state.agentSessions?.[agentId];
  return state.agentSessions?.[`${agentId}::collaboration:${role}:${scopeId}`];
}

function executionRecoveryTranscript(execution: MemberExecution): string {
  return JSON.stringify({
    executionId: execution.id,
    taskId: execution.taskId,
    agentId: execution.agentId,
    purpose: execution.purpose,
    ownershipEpoch: execution.ownershipEpoch,
    status: execution.status,
    output: execution.output ?? null,
    waitReason: execution.waitReason ?? null
  });
}

function groupRecoveryTranscript(group: GroupRun): string {
  return JSON.stringify({
    groupRunId: group.id,
    nodeRunId: group.nodeRunId,
    coordinator: group.actingCoordinatorId ?? group.leaderAgentId,
    coordinatorEpoch: group.coordinatorEpoch,
    status: group.status,
    taskIds: group.taskIds,
    output: group.output ?? null
  });
}

function mainRouteRecoveryTranscript(input: {
  state: ProjectState;
  sourceNodeRunId: string;
  routeScopeId: string;
  routeEpoch: number;
}): string {
  return JSON.stringify({
    projectId: input.state.id,
    sourceNodeRunId: input.sourceNodeRunId,
    routeScopeId: input.routeScopeId,
    routeEpoch: input.routeEpoch,
    workflowRevision: input.state.workflowRevision ?? 1,
    projectStatus: input.state.status,
    projectPhase: input.state.phase
  });
}
