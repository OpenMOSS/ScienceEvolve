import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getModels, getProviders } from "@earendil-works/pi-ai";
import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";
import { AGENT_PROTOCOLS, normalizeGatewayInput, type AgentHarness, type AgentProtocol, type GatewayInput } from "../core/agent-runtime.js";
const HARNESS_NATIVE_PROTOCOL: Record<AgentHarness, AgentProtocol> = { codex: "responses", pi: "chat-completions", dsh: "chat-completions" };

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Obj : {};
const str = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const prefix = (harness: AgentHarness) => `SDK_${harness.toUpperCase().replaceAll("-", "_")}`;
export type GatewayEnvironment = Readonly<Record<string, string | undefined>>;

function expand(value: string, home: string): string {
  return path.resolve(value === "~" ? home : /^~[/\\]/.test(value) ? path.join(home, value.slice(2)) : value);
}
async function read(file: string, optional = false): Promise<unknown> {
  let source: string;
  try { source = await fs.readFile(file, "utf8"); }
  catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw new Error(`Cannot read native profile file: ${path.basename(file)}`);
  }
  try {
    if (file.endsWith(".toml")) return parseToml(source);
    if (/\.ya?ml$/.test(file)) return parseYaml(source, { maxAliasCount: 100 });
    return JSON.parse(source);
  } catch { throw new Error(`Invalid native profile file: ${path.basename(file)}`); }
}
function protocol(value: unknown, fallback: AgentProtocol): AgentProtocol {
  if (value === undefined) return fallback;
  const mapped = value === "openai-responses" ? "responses" : value === "openai-completions" ? "chat-completions" : value;
  if (!AGENT_PROTOCOLS.includes(mapped as AgentProtocol)) throw new Error("Unsupported native gateway protocol");
  return mapped as AgentProtocol;
}
function selectProvider(providers: Obj, selected: unknown): [string, Obj] {
  const id = str(selected) ?? (Object.keys(providers).length === 1 ? Object.keys(providers)[0] : undefined);
  if (!id || !Object.hasOwn(providers, id)) throw new Error("Native profile must select an existing default provider");
  return [id, obj(providers[id])];
}
function configValue(value: unknown, env: GatewayEnvironment): string | undefined {
  const text = str(value);
  if (text?.startsWith("!")) throw new Error("Native credential shell helpers are not supported; use a native environment reference or API key");
  return text ? str(env[text]) ?? text : undefined;
}

/** Reads a native configuration, never the SDK's workflow document. No profile fallback on error. */
export async function readHarnessGateway(
  harness: AgentHarness, model: string, env: GatewayEnvironment = process.env, home = os.homedir(),
  source?: "env" | "profile"
): Promise<GatewayInput> {
  if (!Object.hasOwn(HARNESS_NATIVE_PROTOCOL, harness)) throw new Error(`Unsupported native Harness: ${harness}`);
  const key = prefix(harness);
  const explicitProfile = str(env[`${key}_PROFILE`]);
  const hasDirectConfig = Boolean(str(env[`${key}_API_KEY`]) || str(env[`${key}_BASE_URL`]));
  const profile = source === "env" ? undefined
    : source === "profile" ? explicitProfile ?? "default"
    : explicitProfile ?? (hasDirectConfig ? undefined : "default");
  let url: string | undefined;
  let apiKey: string | undefined;
  let wireProtocol = HARNESS_NATIVE_PROTOCOL[harness];
  let contextWindow: number | undefined;
  let modelReasoning: GatewayInput["modelReasoning"];
  if (!profile) {
    url = str(env[`${key}_BASE_URL`]);
    apiKey = str(env[`${key}_API_KEY`]);
    wireProtocol = protocol(str(env[`${key}_PROTOCOL`]), wireProtocol);
    if (str(env[`${key}_CONTEXT_WINDOW`])) contextWindow = Number(env[`${key}_CONTEXT_WINDOW`]);
  } else {
    const defaults: Record<AgentHarness, string> = {
      codex: env.CODEX_HOME || path.join(home, ".codex"),
      pi: env.PI_CODING_AGENT_DIR || path.join(home, ".pi", "agent"),
      dsh: env.DSH_HOME || path.join(home, ".dsh")
    };
    const location = expand(profile === "default" ? defaults[harness] : profile, home);
    let directory: boolean;
    try { directory = (await fs.stat(location)).isDirectory(); }
    catch { throw new Error(`${key}_PROFILE location does not exist or cannot be read`); }
    const filenames: Record<AgentHarness, string> = { codex: "config.toml", pi: "models.json", dsh: "settings.yaml" };
    let file = directory ? path.join(location, filenames[harness]) : location;
    if (harness === "dsh" && directory) {
      // Newer DSH releases store plugin settings in a native Cordis patch.
      for (const candidate of ["settings.yaml", "cordis.patch.yml", "profiles/headless/cordis.patch.yml"]) {
        try { await fs.access(path.join(location, candidate)); file = path.join(location, candidate); break; } catch { /* Try native layout. */ }
      }
    }
    const root = directory ? location : path.dirname(location);
    const raw = await read(file, directory && (harness === "codex" || harness === "pi"));
    const config = obj(raw);
    if (harness === "codex") {
      const selected = str(config.profile);
      const effective = selected ? { ...config, ...obj(obj(config.profiles)[selected]) } : config;
      if (selected && !Object.hasOwn(obj(config.profiles), selected)) throw new Error("Codex selected profile does not exist");
      const id = str(effective.model_provider) ?? "openai";
      const provider = obj(obj(config.model_providers)[id]);
      if (id !== "openai" && !Object.keys(provider).length) throw new Error("Codex model_provider does not exist");
      url = str(provider.base_url) ?? (id === "openai" ? "https://api.openai.com/v1" : undefined);
      const auth = obj(await read(path.join(root, "auth.json"), true));
      const reference = str(provider.env_key);
      apiKey = reference ? str(env[reference]) : str(provider.experimental_bearer_token) ?? str(auth.OPENAI_API_KEY);
      wireProtocol = protocol(provider.wire_api, "responses");
      contextWindow = typeof effective.model_context_window === "number" ? effective.model_context_window : undefined;
    } else if (harness === "pi") {
      const settings = obj(await read(path.join(root, "settings.json"), true));
      const providers = obj(config.providers);
      const defaultProvider = str(settings.defaultProvider);
      if (defaultProvider && !Object.hasOwn(providers, defaultProvider) && getProviders().some((id) => id === defaultProvider)) {
        providers[defaultProvider] = {};
      }
      const [id, configured] = selectProvider(providers, defaultProvider);
      const knownProvider = getProviders().find((candidate) => candidate === id);
      const catalog = knownProvider ? getModels(knownProvider) : [];
      const nativeModel = catalog.find((entry) => entry.id === model) ?? catalog[0];
      const provider: Obj = { ...(nativeModel ? { baseUrl: nativeModel.baseUrl, api: nativeModel.api } : {}), ...configured };
      const models = Array.isArray(provider.models) ? provider.models : [];
      const selectedModel = obj(models.find((item) => obj(item).id === model));
      if (selectedModel.baseUrl && selectedModel.baseUrl !== provider.baseUrl) throw new Error("Model-specific gateway URLs are not supported; configure the Harness provider URL");
      url = str(provider.baseUrl);
      wireProtocol = protocol(selectedModel.api ?? provider.api, "chat-completions");
      const auth = obj(obj(await read(path.join(root, "auth.json"), true))[id]);
      apiKey = provider.apiKey !== undefined ? configValue(provider.apiKey, env)
        : auth.type === "api_key" ? configValue(auth.key, env) : undefined;
      contextWindow = typeof selectedModel.contextWindow === "number" ? selectedModel.contextWindow : nativeModel?.contextWindow;
    } else {
      // DSH 0.1.x settings mapping and native Cordis profile patches use the same plugin configs.
      const plugins = Array.isArray(raw) ? Object.fromEntries(raw.map((entry) => [str(obj(entry).id), obj(entry).config])) : config;
      const providers = obj(obj(plugins["llm-pi-ai"]).providers);
      const defaults = obj(plugins["agent-default-model"]);
      const credentialsRoot = path.basename(path.dirname(root)) === "profiles" ? path.dirname(path.dirname(root)) : root;
      const credentials = obj(await read(path.join(credentialsRoot, ".credentials.yaml"), true));
      const refs = credentials.version === 1 ? obj(credentials.refs) : credentials;
      if (Object.keys(providers).length) {
        const [, provider] = selectProvider(providers, defaults.provider);
        url = str(provider.baseURL);
        wireProtocol = protocol(provider.api, "chat-completions");
        const ref = str(provider.apiKeyEnv);
        apiKey = ref ? str(refs[ref]) ?? str(env[ref]) : undefined;
        const models = Array.isArray(provider.models) ? provider.models : [];
        const selectedModel = obj(models.find((item) => obj(item).id === model));
        contextWindow = typeof selectedModel.contextWindow === "number" ? selectedModel.contextWindow : undefined;
      } else {
        const provider = obj(plugins["llm-deepseek"]);
        const ref = str(provider.apiKeyEnv) ?? "DEEPSEEK_API_KEY";
        url = str(provider.baseURL) ?? str(env.DEEPSEEK_BASE_URL) ?? "https://api.deepseek.com";
        apiKey = str(refs[ref]) ?? str(env[ref]);
        wireProtocol = "chat-completions";
      }
    }
  }
  const reasoningJson = str(env[`${key}_REASONING_JSON`]);
  const reasoningFile = str(env[`${key}_REASONING_FILE`]);
  if (reasoningJson && reasoningFile) {
    throw new Error(`${key}_REASONING_JSON and ${key}_REASONING_FILE cannot both be set`);
  }
  if (reasoningJson || reasoningFile) {
    try {
      const value = reasoningJson
        ? JSON.parse(reasoningJson) as unknown
        : await read(expand(reasoningFile!, home));
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
      modelReasoning = value as GatewayInput["modelReasoning"];
    } catch {
      throw new Error(`${key} reasoning configuration must be a valid JSON object`);
    }
  }
  if (!url || !apiKey) throw new Error(profile
    ? `${key}_PROFILE has no usable API-key gateway; SDK key/URL fallback is disabled when PROFILE is set (OAuth-only profiles are not supported)`
    : `Configure ${key}_PROFILE=default or a native profile path, or both ${key}_API_KEY and ${key}_BASE_URL`);
  try {
    return normalizeGatewayInput({ name: `Harness ${harness}`, url, apiKey, protocol: wireProtocol,
      models: [model], defaultModel: model,
      ...(modelReasoning ? { modelReasoning } : {}),
      ...(contextWindow === undefined ? {} : { modelContextWindows: { [model]: contextWindow } }) });
  } catch { throw new Error(`${key} gateway has an invalid URL, API key, protocol, model or context window`); }
}
