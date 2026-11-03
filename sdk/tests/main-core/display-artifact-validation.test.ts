import { describe, expect, it, vi } from "vitest";
import { validateDisplayArtifacts } from "../../src/core/display-artifact-validation.js";
import type { ControlActionEnvelope, DisplaySelection, ProjectState } from "../../src/core/types.js";
import type { ProjectStorage } from "../../src/core/storage.js";
import { PublishedArtifactIntegrityError } from "../../src/core/storage.js";

const display: DisplaySelection = { primary: { agent: "writing", path: "report.md" }, items: [] };
function fixture(registered = false) {
  const state = { id: "prj_fixture", artifacts: registered ? [{ id: "artifact", agent: "writing", path: "report.md" }] : [] } as unknown as ProjectState;
  const storage = { resolveWorkspaceArtifact: vi.fn(async () => ({ relativePath: "report.md" })),
    resolvePublishedArtifactRecord: vi.fn(async () => ({})) } as unknown as Pick<ProjectStorage, "resolveWorkspaceArtifact" | "resolvePublishedArtifactRecord">;
  return { state, storage };
}
describe("display publication validation", () => {
  it("rejects an existing unpublished file immediately with an actionable field and code", async () => {
    const { state, storage } = fixture();
    await expect(validateDisplayArtifacts(storage, state, display)).rejects.toMatchObject({ rejection: {
      code: "DISPLAY_ARTIFACT_NOT_PUBLISHED", invalidField: "primary.path",
      stateDetails: { requiredAction: "publish_artifact", path: "report.md", agent: "writing" }
    } });
    expect(storage.resolvePublishedArtifactRecord).not.toHaveBeenCalled();
  });
  it("accepts earlier staged publication with an absolute/canonical alias, without publishing anything", async () => {
    const { state, storage } = fixture();
    const pending = { agent: "writing", action: { tool: "publish_artifact", path: "/project/workspaces/report.md" } } as ControlActionEnvelope;
    await expect(validateDisplayArtifacts(storage, state, display, [pending])).resolves.toBeUndefined();
    expect(storage.resolvePublishedArtifactRecord).not.toHaveBeenCalled();
    expect(state.artifacts).toEqual([]);
    // Atomic commit revalidates registered facts; a staged receipt alone is insufficient.
    await expect(validateDisplayArtifacts(storage, state, display)).rejects.toMatchObject({ rejection: { code: "DISPLAY_ARTIFACT_NOT_PUBLISHED" } });
  });
  it.each(["ENOENT: report.md does not exist", "Published artifact hash differs from registered version"])("preserves the real availability/version cause: %s", async message => {
    const { state, storage } = fixture(true);
    const original = new Error(message);
    vi.mocked(storage.resolvePublishedArtifactRecord).mockRejectedValueOnce(original);
    await expect(validateDisplayArtifacts(storage, state, display)).rejects.toMatchObject({ cause: original,
      rejection: { code: "DISPLAY_ARTIFACT_UNAVAILABLE", message: expect.stringContaining(message), invalidField: "primary.path" } });
  });
  it("distinguishes a missing file from an immutable version/hash mismatch", async () => {
    const { state, storage } = fixture(true);
    const missing = Object.assign(new Error("ENOENT: report.md"), { code: "ENOENT" });
    vi.mocked(storage.resolveWorkspaceArtifact).mockRejectedValueOnce(missing);
    await expect(validateDisplayArtifacts(storage, state, display)).rejects.toMatchObject({ cause: missing, rejection: { code: "DISPLAY_ARTIFACT_MISSING" } });
    const mismatch = new PublishedArtifactIntegrityError("ARTIFACT_VERSION_MISMATCH", "Published artifact changed after publication",
      { size: 12, sha256: "a".repeat(64) }, { size: 14, sha256: "b".repeat(64) });
    vi.mocked(storage.resolvePublishedArtifactRecord).mockRejectedValueOnce(mismatch);
    await expect(validateDisplayArtifacts(storage, state, display)).rejects.toMatchObject({ cause: mismatch, rejection: {
      code: "DISPLAY_ARTIFACT_VERSION_MISMATCH", stateDetails: { expected: mismatch.expected, actual: mismatch.actual }
    } });
  });

});
