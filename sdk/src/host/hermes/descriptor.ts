import type { HarnessDescriptor } from "../../core/harness-runtime/contracts.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../../core/harness-runtime/registry.js";

/** SDK extension metadata; the common catalog does not enable this product feature. */
export const HERMES_DESCRIPTOR: HarnessDescriptor = {
  schemaVersion: 1,
  id: "hermes",
  label: "Hermes",
  adapterVersion: "1",
  nativeProtocol: "chat-completions",
  purposes: ["workflow", "explainer", "probe"],
  executableEnv: "SCIENCEEVOLVE_HERMES_BIN",
  defaultCommand: "hermes",
  notes: "NousResearch Hermes native ACP session/event adapter",
  explainerIsolation: "adapter-read-only-tools",
  route: { webSearchMcp: true, requireMainControlTools: true },
  capabilities: { ...BUILTIN_HARNESS_DESCRIPTORS.find(item => item.id === "pi")!.capabilities }
};
