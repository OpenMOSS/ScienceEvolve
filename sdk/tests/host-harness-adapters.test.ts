import { describe, expect, it } from "vitest";
import { HarnessRuntimeFacade } from "../src/core/harness-runtime/runtime.js";
import { createSdkHarnessRuntime } from "../src/host/harness-adapters.js";
import { CodexAdapter } from "../src/core/harness-runtime/adapters/codex-adapter.js";

describe("SDK host harness composition", () => {
  it("uses the same supported harnesses as the common runtime", () => {
    const core = new HarnessRuntimeFacade();
    const sdk = createSdkHarnessRuntime();
    expect(core.harnessIds().sort()).toEqual(["codex", "dsh", "pi"]);
    expect(sdk.harnessIds().sort()).toEqual(["codex", "dsh", "pi"]);
  });
  it("supports an explicit host adapter set", () => {
    const sdk = createSdkHarnessRuntime({ adapters: [new CodexAdapter()] });
    expect(sdk.harnessIds()).toEqual(["codex"]);
  });
});
