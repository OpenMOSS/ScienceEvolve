import path from "node:path";
import {
  launchPlan, residentEnvironment, residentMcpRows,
  type ResidentAdapterLaunchDefinition, type ResidentAdapterLaunchRequest
} from "../../core/harness-runtime/adapters/resident-adapter-factory.js";
import {
  gatewayModelContextWindow, harnessExecutableLaunch, safeName
} from "../../core/harness-runtime/adapters/adapter-utils.js";
import { hermesAcpCodec } from "./hermes-acp.js";
import { hermesSkillPrompt, prepareHermesSettings } from "./hermes-settings.js";

/** Protocol-specific preparation; the shared host validates and launches the result. */
export async function buildHermesResidentLaunch(input: ResidentAdapterLaunchRequest): Promise<ResidentAdapterLaunchDefinition> {
  if ("nativeCodexProfileHome" in input.launchRoute) throw new Error("Hermes requires a Gateway route");
  const { spec } = input;
  const home = path.join(input.request.projectPath, "runtime", "harness-sessions",
    safeName(input.request.agent), "hermes");
  const allowNativeTools = input.filesystemAuthority.rawTools === "trusted-yolo";
  const prepared = await prepareHermesSettings({ home, cwd: spec.inputs.workspacePath,
    baseUrl: input.launchRoute.baseUrl, model: spec.model,
    contextWindow: gatewayModelContextWindow(input.request, spec.model),
    allowNativeTools, session: input.session });
  const launch = harnessExecutableLaunch(input.executable, ["acp"]);
  const environment = residentEnvironment(input, {
    HOME: input.filesystemAuthority.serviceUserRoot, HERMES_HOME: home,
    HERMES_IGNORE_RULES: "1", HERMES_ACP_SKIP_CONFIGURED_MCP: "1"
  });
  return {
    plan: launchPlan(input, launch.command, launch.args, environment,
      ["HERMES_HOME", "HERMES_IGNORE_RULES", "HERMES_ACP_SKIP_CONFIGURED_MCP"]),
    codec: hermesAcpCodec({ cwd: spec.inputs.workspacePath, model: spec.model,
      mcpRows: await residentMcpRows(input), allowNativeTools, ...prepared,
      promptPreamble: await hermesSkillPrompt([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]) })
  };
}
