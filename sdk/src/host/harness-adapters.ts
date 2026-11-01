import { HarnessRuntimeFacade, type HarnessRuntimeOptions } from "../core/harness-runtime/runtime.js";
import { harnessCatalogRegistry } from "../core/harness-runtime/registry.js";
import { HermesAdapter } from "./hermes/hermes-adapter.js";
import { HERMES_DESCRIPTOR } from "./hermes/descriptor.js";

/** SDK-only metadata for its existing executable selection and configuration API. */
if (!harnessCatalogRegistry.has(HERMES_DESCRIPTOR.id)) {
  harnessCatalogRegistry.register(new HermesAdapter());
} else if (JSON.stringify(harnessCatalogRegistry.descriptor(HERMES_DESCRIPTOR.id)) !== JSON.stringify(HERMES_DESCRIPTOR)) {
  throw new Error("SDK Hermes catalog metadata conflicts with an existing registration");
}

export function createSdkHarnessRuntime(options: HarnessRuntimeOptions = {}): HarnessRuntimeFacade {
  return new HarnessRuntimeFacade({
    ...options,
    ...(!options.adapters ? {
      additionalAdapters: [new HermesAdapter(options), ...(options.additionalAdapters ?? [])]
    } : {})
  });
}
