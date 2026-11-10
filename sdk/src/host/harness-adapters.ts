import { HarnessRuntimeFacade, type HarnessRuntimeOptions } from "../core/harness-runtime/runtime.js";

export function createSdkHarnessRuntime(options: HarnessRuntimeOptions = {}): HarnessRuntimeFacade {
  return new HarnessRuntimeFacade(options);
}
