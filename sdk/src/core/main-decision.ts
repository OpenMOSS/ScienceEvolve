import type { AgentOrchestrationTemplate, MainDecision, ProjectState } from "./types.js";
import { isConfiguredAgent, workflowRoutesForAgent } from "./agent-orchestration.js";
import { SYSTEM_CONTROLLER_AGENT } from "./system-controller.js";
import { buildMainCapabilitySnapshot } from "./prompt.js";

/** A structurally valid Main response violated the active routing contract. */
export class MainDecisionValidationError extends Error {
  override name = "MainDecisionValidationError";
}

export function resolveMainDecision(
  state: ProjectState,
  raw: MainDecision
): MainDecision {
  const orchestration = state.orchestration;
  const pending = state.pendingMainDecision;
  const capabilities = state.mainCapabilities ??
    pending?.capabilities ??
    buildMainCapabilitySnapshot(state);
  const allowedCandidates = capabilities.routeCandidates;
  const isAgentTarget =
    raw.nextAgent !== "finish" && raw.nextAgent !== "user";
  if (raw.display) {
    validateDisplaySelection(orchestration, raw.display);
  }
  if (raw.nextAgent === "user" && !capabilities.canRequestUser) {
    throw new MainDecisionValidationError(
      "Main cannot request user intervention because this workflow has it disabled"
    );
  }
  if (raw.nextAgent === "finish") {
    const weakFinishSelection = capabilities.controlMode === "weak-branch" &&
      allowedCandidates.includes("finish");
    if (!capabilities.canComplete && !weakFinishSelection) {
      throw new MainDecisionValidationError(
        `Main selected finish outside a configured termination decision`
      );
    }
    assertMainRouteIsValid(state, raw);
    return { ...raw };
  }
  if (isAgentTarget && !isConfiguredAgent(orchestration, raw.nextAgent)) {
    throw new MainDecisionValidationError(
      `Main cannot route to unknown Agent name ${raw.nextAgent}`
    );
  }
  if (
    isAgentTarget &&
    !allowedCandidates.includes(raw.nextAgent)
  ) {
    throw new MainDecisionValidationError(
      `Main selected ${raw.nextAgent}, but the configured candidate edges are: ${allowedCandidates.join(", ")}`
    );
  }
  return { ...raw };
}

export function validateDisplaySelection(
  orchestration: AgentOrchestrationTemplate,
  display: NonNullable<MainDecision["display"]>
): void {
  const entries = [display.primary, ...display.items];
  for (const item of entries) {
    if (!isConfiguredAgent(orchestration, item.agent)) {
      throw new MainDecisionValidationError(
        `Main cannot display a file from unknown Agent ${item.agent}`
      );
    }
    if (item.path.includes("\0")) {
      throw new MainDecisionValidationError(
        `Main selected an invalid display path: ${item.path}`
      );
    }
  }
}

function assertMainRouteIsValid(
  state: ProjectState,
  decision: MainDecision
): void {
  const orchestration = state.orchestration;
  if (decision.nextAgent !== "finish") return;
  if (orchestration.termination.agent === SYSTEM_CONTROLLER_AGENT) return;
  const pending = state.pendingMainDecision;
  const routeSource = pending?.sourceAgent ?? orchestration.termination.agent;
  const finishConfigured = workflowRoutesForAgent(orchestration, routeSource).some(
    (edge) => edge.target === "finish"
  );
  if (!finishConfigured) {
    throw new MainDecisionValidationError(
      `Main cannot finish because ${routeSource} has no configured finish edge`
    );
  }
}
