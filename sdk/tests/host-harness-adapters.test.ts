import { describe, expect, it } from "vitest";
import { HarnessRuntimeFacade } from "../src/core/harness-runtime/runtime.js";
import { createSdkHarnessRuntime } from "../src/host/harness-adapters.js";
import { CodexAdapter } from "../src/core/harness-runtime/adapters/codex-adapter.js";
import { HermesAdapter } from "../src/host/hermes/hermes-adapter.js";

describe("SDK host harness composition", () => {
  it("keeps common builtins independent and preserves the SDK Hermes extension", () => {
    const core = new HarnessRuntimeFacade();
    const sdk = createSdkHarnessRuntime();
    expect(core.harnessIds().sort()).toEqual(["claude-code", "codex", "dsh", "pi"]);
    expect(sdk.harnessIds().sort()).toEqual(["claude-code", "codex", "dsh", "hermes", "pi"]);
  });
  it("supports an explicit host adapter set", () => {
    const sdk = createSdkHarnessRuntime({ adapters: [new CodexAdapter(), new HermesAdapter()] });
    expect(sdk.harnessIds()).toEqual(["codex", "hermes"]);
  });
});
