import { ControlActionRejectedError } from "./orchestration-control-bridge.js";
import type { ProjectStorage } from "./storage.js";
import type { ControlActionEnvelope, DisplaySelection, ProjectState } from "./types.js";
import { redactTrace } from "./utils.js";

/** Validate before acknowledging a staged selection. Earlier publication
 * requests in the same transaction count; this function publishes nothing. */
export async function validateDisplayArtifacts(
  storage: Pick<ProjectStorage, "resolveWorkspaceArtifact" | "resolvePublishedArtifactRecord">,
  state: ProjectState, display: DisplaySelection, staged: readonly ControlActionEnvelope[] = []
): Promise<void> {
  for (const [index, item] of [display.primary, ...display.items].entries()) {
    const invalidField = index === 0 ? "primary.path" : `items.${index - 1}.path`;
    try {
      const source = await storage.resolveWorkspaceArtifact(state.id, item.agent, item.path);
      let pending = false;
      for (const envelope of staged) {
        if (envelope.agent !== item.agent || envelope.action.tool !== "publish_artifact") continue;
        const publication = await storage.resolveWorkspaceArtifact(state.id, envelope.agent, envelope.action.path);
        if (publication.relativePath === source.relativePath) { pending = true; break; }
      }
      if (pending) continue;
      const registered = state.artifacts?.find(artifact =>
        artifact.agent === item.agent && artifact.path === source.relativePath);
      if (!registered) throw new ControlActionRejectedError({ code: "DISPLAY_ARTIFACT_NOT_PUBLISHED",
        message: `Display selection must reference a published artifact: ${item.agent}/${source.relativePath}. The owning Agent must call publish_artifact before select_display; an existing file alone is not a publication.`,
        invalidField, stateDetails: { agent: item.agent, path: source.relativePath,
          requiredAction: "publish_artifact", stage: "select_display" } });
      await storage.resolvePublishedArtifactRecord(state.id, registered);
    } catch (error) {
      if (error instanceof ControlActionRejectedError) throw error;
      const detail = error as Error & { code?: string; expected?: { size: number; sha256?: string }; actual?: { size: number; sha256: string } };
      const code = detail.code === "ENOENT" ? "DISPLAY_ARTIFACT_MISSING"
        : detail.code === "ARTIFACT_VERSION_MISMATCH" ? "DISPLAY_ARTIFACT_VERSION_MISMATCH"
          : detail.code === "ARTIFACT_INTEGRITY_MISSING" ? "DISPLAY_ARTIFACT_INTEGRITY_MISSING" : "DISPLAY_ARTIFACT_UNAVAILABLE";
      throw new ControlActionRejectedError({ code,
        message: `Cannot select ${item.agent}/${item.path}: ${redactTrace(error instanceof Error ? error.message : String(error))}`,
        invalidField, stateDetails: { agent: item.agent, path: item.path, stage: "select_display",
          ...(["ARTIFACT_VERSION_MISMATCH", "ARTIFACT_INTEGRITY_MISSING"].includes(detail.code ?? "")
            ? { expected: detail.expected, actual: detail.actual } : {}) } },
      { cause: error });
    }
  }
}
