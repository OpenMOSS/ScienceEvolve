import { createHash } from "node:crypto";
import { access, realpath, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  HarnessAdapter,
  HarnessDescriptor,
  HarnessId,
  HarnessPurpose,
  HarnessRuntimeToolCatalog,
  PublicHarnessDescriptor,
  RuntimeMcpToolDefinition
} from "./contracts.js";
import { compileRuntimeMcpToolCatalog } from "./tool-catalog.js";
import {
  HarnessPurposeUnsupportedError,
  UnknownHarnessError
} from "./errors.js";

const COMMON_CAPABILITIES = {
  structuredEvents: true,
  toolResults: true,
  durableSession: true,
  permissionPrompts: ["workspace", "compute", "yolo"],
  workspaceInputs: true,
  autoSkills: true,
  officialEvents: true,
  toolEvents: true,
  usageEvents: true,
  readOnlyExplainer: true,
  explainerInputFormats: ["text"],
  webSearch: true,
  skills: true,
  mcp: true,
  assistantStreaming: "native"
} as const;

const HARNESS_PURPOSES = new Set(["workflow", "explainer", "probe"]);
const HARNESS_PROTOCOLS = new Set(["responses", "chat-completions", "anthropic-messages"]);
const REQUIRED_PERMISSIONS = new Set(["workspace", "compute", "yolo"]);
const SAFE_ENV_KEY = /^[A-Z][A-Z0-9_]{0,127}$/;
const WINDOWS_NPM_ENTRYPOINTS: Readonly<Record<string, readonly string[]>> = {
  dsh: ["@deepseek-ai", "dsh", "lib", "bin.js"],
  pi: ["@mariozechner", "pi-coding-agent", "dist", "cli.js"],
  "claude-code": ["@anthropic-ai", "claude-code", "bin", "claude.exe"]
};

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) return value;
  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);
  for (const key of Reflect.ownKeys(object)) {
    deepFreeze((object as unknown as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
}

/** The sole built-in metadata table. Other modules consume the Registry/Catalog. */
export const BUILTIN_HARNESS_DESCRIPTORS: readonly HarnessDescriptor[] = [
  {
    schemaVersion: 1,
    id: "dsh",
    label: "dsh",
    adapterVersion: "1",
    nativeProtocol: "chat-completions",
    purposes: ["workflow", "explainer", "probe"],
    executableEnv: "SCIENCEEVOLVE_DSH_BIN",
    defaultCommand: "dsh",
    notes: "DeepSeek Harness SDK session/event adapter",
    explainerIsolation: "adapter-read-only-tools",
    route: {
      webSearchMcp: true,
    },
    capabilities: COMMON_CAPABILITIES
  },
  {
    schemaVersion: 1,
    id: "pi",
    label: "pi",
    adapterVersion: "1",
    nativeProtocol: "chat-completions",
    purposes: ["workflow", "explainer", "probe"],
    executableEnv: "SCIENCEEVOLVE_PI_BIN",
    defaultCommand: "pi",
    notes: "Pi JSON event adapter",
    explainerIsolation: "adapter-read-only-tools",
    route: {
      webSearchMcp: true,
    },
    // Pi receives invocation-scoped Web Search and Web Fetch through the
    // OpenFARS MCP extension; its native bash tool remains available.
    capabilities: COMMON_CAPABILITIES
  },
  {
    schemaVersion: 1,
    id: "codex",
    label: "Codex",
    adapterVersion: "4",
    nativeProtocol: "responses",
    purposes: ["workflow", "explainer", "probe"],
    executableEnv: "SCIENCEEVOLVE_CODEX_BIN",
    defaultCommand: "codex",
    default: true,
    notes: "Codex JSONL adapter",
    explainerIsolation: "adapter-read-only-tools",
    route: {
      requireMainControlTools: true,
      nativeProfileAuth: true,
    },
    capabilities: {
      ...COMMON_CAPABILITIES,
      assistantStreaming: "proxy-visible-output"
    }
  },
  {
    schemaVersion: 1,
    id: "claude-code",
    label: "Claude Code",
    adapterVersion: "1",
    nativeProtocol: "anthropic-messages",
    purposes: ["workflow", "explainer", "probe"],
    selectable: false,
    executableEnv: "SCIENCEEVOLVE_CLAUDE_CODE_BIN",
    defaultCommand: "claude",
    userSelectable: false,
    notes: "Claude Code stream-json adapter",
    explainerIsolation: "adapter-read-only-tools",
    route: {
      requireMainControlTools: true,
    },
    capabilities: { ...COMMON_CAPABILITIES, explainerInputFormats: ["text", "image", "pdf"] }
  }
] as const;

export const DEFAULT_HARNESS_ID = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.default)!.id;
export const HARNESS_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,63})$/;

interface PublicHarnessAvailability {
  available: boolean;
  availabilityReason?: string;
  executableFingerprint?: string;
}

/** Explicit allowlist projection for every server-to-browser Catalog entry. */
export function toPublicHarnessDescriptor(
  descriptor: HarnessDescriptor,
  availability: PublicHarnessAvailability
): PublicHarnessDescriptor {
  return {
    schemaVersion: descriptor.schemaVersion,
    id: descriptor.id,
    label: descriptor.label,
    adapterVersion: descriptor.adapterVersion,
    nativeProtocol: descriptor.nativeProtocol,
    purposes: [...descriptor.purposes],
    ...(descriptor.selectable === false ? { selectable: false } : {}),
    ...(descriptor.default === true ? { default: true } : {}),
    ...(descriptor.userSelectable === false ? { userSelectable: false } : {}),
    notes: descriptor.notes,
    capabilities: structuredClone(descriptor.capabilities),
    available: availability.available,
    ...(availability.availabilityReason
      ? { availabilityReason: availability.availabilityReason }
      : {}),
    ...(availability.executableFingerprint
      ? { executableFingerprint: availability.executableFingerprint }
      : {})
  };
}

export function assertSafeHarnessId(value: string): string {
  if (!HARNESS_ID_PATTERN.test(value)) {
    throw new Error("Harness ID must be 1-64 lowercase letters, numbers, dots, underscores or hyphens");
  }
  return value;
}

export class HarnessRegistry {
  private readonly adapters = new Map<HarnessId, HarnessAdapter>();
  private readonly descriptors = new Map<HarnessId, HarnessDescriptor>();

  constructor(
    descriptors: readonly HarnessDescriptor[] = BUILTIN_HARNESS_DESCRIPTORS,
    adapters: readonly HarnessAdapter[] = []
  ) {
    for (const descriptor of descriptors) this.addDescriptor(descriptor);
    for (const adapter of adapters) this.register(adapter);
    const defaults = [...this.descriptors.values()].filter((item) => item.default);
    if (defaults.length !== 1) {
      throw new Error(`Harness Registry requires exactly one default; received ${defaults.length}`);
    }
  }

  register(adapter: HarnessAdapter): void {
    const supplied = adapter.descriptor;
    const expected = this.descriptors.get(supplied.id);
    if (!expected) this.addDescriptor(supplied);
    else if (JSON.stringify(expected) !== JSON.stringify(supplied)) {
      throw new Error(`Adapter descriptor conflicts with catalog metadata: ${supplied.id}`);
    }
    const authoritative = this.descriptors.get(supplied.id)!;
    if (this.adapters.has(authoritative.id)) {
      throw new Error(`Duplicate Harness Adapter ID: ${authoritative.id}`);
    }
    try {
      Object.defineProperty(adapter, "descriptor", {
        value: authoritative,
        enumerable: true,
        configurable: false,
        writable: false
      });
    } catch {
      throw new Error(`Harness Adapter descriptor cannot be bound: ${authoritative.id}`);
    }
    this.adapters.set(authoritative.id, adapter);
  }

  descriptor(id: HarnessId, purpose?: HarnessPurpose): HarnessDescriptor {
    const descriptor = this.descriptors.get(id);
    if (!descriptor) throw new UnknownHarnessError(id);
    if (purpose && !descriptor.purposes.includes(purpose)) {
      throw new HarnessPurposeUnsupportedError(id, purpose);
    }
    return descriptor;
  }

  adapter(id: HarnessId, purpose: HarnessPurpose): HarnessAdapter {
    this.descriptor(id, purpose);
    return this.registeredAdapter(id);
  }

  /** Resolve an Adapter for purpose-neutral lifecycle cleanup. */
  registeredAdapter(id: HarnessId): HarnessAdapter {
    this.descriptor(id);
    const adapter = this.adapters.get(id);
    if (!adapter) throw new UnknownHarnessError(id);
    return adapter;
  }

  has(id: HarnessId): boolean {
    return this.descriptors.has(id);
  }

  defaultHarnessId(): HarnessId {
    return [...this.descriptors.values()].find((item) => item.default)!.id;
  }

  list(): HarnessDescriptor[] {
    return [...this.descriptors.values()].map((item) => structuredClone(item));
  }

  adapterIds(purpose?: HarnessPurpose): HarnessId[] {
    return [...this.adapters.keys()].filter((id) =>
      !purpose || this.descriptors.get(id)?.purposes.includes(purpose)
    );
  }

  /**
   * Compile an auditable catalog only after an MCP server has returned its
   * permission-scoped tools/list. Static descriptor metadata is never used as
   * a substitute for runtime names or JSON Schemas.
   */
  nativeToolCatalog(
    id: HarnessId,
    namespace: string,
    tools: readonly RuntimeMcpToolDefinition[]
  ): HarnessRuntimeToolCatalog {
    const descriptor = this.descriptor(id);
    if (!descriptor.capabilities.mcp || !descriptor.capabilities.toolResults) {
      throw new Error(`Harness ${id} cannot receive an MCP runtime catalog`);
    }
    return compileRuntimeMcpToolCatalog({ harnessId: id, namespace, tools });
  }

  async publicCatalog(): Promise<PublicHarnessDescriptor[]> {
    return Promise.all(this.list().map(async (descriptor) => {
      const adapter = this.adapters.get(descriptor.id);
      if (!adapter) {
        return toPublicHarnessDescriptor(descriptor, {
          available: false,
          availabilityReason: "Harness Adapter 未注册"
        });
      }
      try {
        const executable = await adapter.resolveExecutable();
        if (!executable) {
          return toPublicHarnessDescriptor(descriptor, {
            available: false,
            availabilityReason: "项目内置或显式配置的可执行入口未找到或不可执行"
          });
        }
        return toPublicHarnessDescriptor(descriptor, {
          available: true,
          executableFingerprint: await adapter.fingerprint(executable)
        });
      } catch {
        // Availability discovery is isolated per Adapter. The public Catalog
        // remains usable and never exposes an executable path or raw error.
        return toPublicHarnessDescriptor(descriptor, {
          available: false,
          availabilityReason: "Harness 可用性探测失败"
        });
      }
    }));
  }

  private addDescriptor(descriptor: HarnessDescriptor): void {
    assertSafeHarnessId(descriptor.id);
    if (this.descriptors.has(descriptor.id)) {
      throw new Error(`Duplicate Harness descriptor ID: ${descriptor.id}`);
    }
    if (descriptor.schemaVersion !== 1) {
      throw new Error(`Harness ${descriptor.id} has an unsupported descriptor schema`);
    }
    if (descriptor.default && descriptor.userSelectable === false) {
      throw new Error(`Harness ${descriptor.id} cannot be both default and non-selectable`);
    }
    if (!descriptor.label.trim() || descriptor.label.length > 128 ||
      !descriptor.adapterVersion.trim() || descriptor.adapterVersion.length > 128 ||
      !descriptor.notes.trim() || descriptor.notes.length > 2_000) {
      throw new Error(`Harness ${descriptor.id} has invalid public metadata`);
    }
    if (!HARNESS_PROTOCOLS.has(descriptor.nativeProtocol)) {
      throw new Error(`Harness ${descriptor.id} has an invalid native protocol`);
    }
    if (!descriptor.purposes.length ||
      new Set(descriptor.purposes).size !== descriptor.purposes.length ||
      descriptor.purposes.some((purpose) => !HARNESS_PURPOSES.has(purpose))) {
      throw new Error(`Harness ${descriptor.id} has invalid purposes`);
    }
    if (!SAFE_ENV_KEY.test(descriptor.executableEnv) ||
      !descriptor.defaultCommand.trim() || descriptor.defaultCommand.length > 512 ||
      /[\u0000-\u001f\u007f]/u.test(descriptor.defaultCommand)) {
      throw new Error(`Harness ${descriptor.id} has invalid executable metadata`);
    }
    const permissions = descriptor.capabilities.permissionPrompts;
    if (!descriptor.capabilities.durableSession ||
      !descriptor.capabilities.officialEvents || !descriptor.capabilities.structuredEvents ||
      !descriptor.capabilities.toolEvents || !descriptor.capabilities.toolResults ||
      !descriptor.capabilities.usageEvents || !descriptor.capabilities.workspaceInputs ||
      permissions.length !== REQUIRED_PERMISSIONS.size ||
      new Set(permissions).size !== REQUIRED_PERMISSIONS.size ||
      permissions.some((permission) => !REQUIRED_PERMISSIONS.has(permission))) {
      throw new Error(`Harness ${descriptor.id} lacks required durable-session/event capabilities`);
    }
    const supportsExplainer = descriptor.purposes.includes("explainer");
    const inputFormats = descriptor.capabilities.explainerInputFormats;
    if (inputFormats !== undefined && (!Array.isArray(inputFormats) || !inputFormats.includes("text") ||
      new Set(inputFormats).size !== inputFormats.length || inputFormats.some(format => !["text", "image", "pdf"].includes(format)))) {
      throw new Error(`Harness ${descriptor.id} has invalid explainer input formats`);
    }
    if (supportsExplainer !== descriptor.capabilities.readOnlyExplainer ||
      (supportsExplainer && !descriptor.explainerIsolation)) {
      throw new Error(`Harness ${descriptor.id} has an invalid read-only explainer contract`);
    }
    this.descriptors.set(descriptor.id, deepFreeze(structuredClone(descriptor)));
  }
}

/** Metadata-only catalog used by validation before process adapters are constructed. */
export const harnessCatalogRegistry = new HarnessRegistry();

export async function resolveHarnessExecutable(
  descriptor: HarnessDescriptor,
  explicitOverride?: string
): Promise<string | undefined> {
  const explicit = explicitOverride?.trim() || process.env[descriptor.executableEnv]?.trim();
  if (explicit && path.isAbsolute(explicit) && !isRejectedHarnessExecutable(descriptor, explicit)) {
    const resolved = await resolveExecutableCandidate(descriptor, explicit);
    if (resolved) return resolved;
  }
  for (const candidate of installedHarnessCandidates(descriptor)) {
    const resolved = await resolveExecutableCandidate(descriptor, candidate);
    if (resolved) return resolved;
  }
  if (!path.isAbsolute(descriptor.defaultCommand)) {
    for (const directory of (process.env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
      const base = path.join(directory, descriptor.defaultCommand);
      const candidates = process.platform === "win32"
        ? [`${base}.exe`, `${base}.com`, `${base}.cmd`, base]
        : [base];
      for (const candidate of candidates) {
        const resolved = await resolveExecutableCandidate(descriptor, candidate);
        if (resolved) return resolved;
      }
    }
  }
  return undefined;
}

async function resolveExecutableCandidate(
  descriptor: HarnessDescriptor,
  candidate: string
): Promise<string | undefined> {
  if (process.platform !== "win32") {
    return await isExecutable(candidate) ? realpath(candidate) : undefined;
  }
  const extension = path.extname(candidate).toLowerCase();
  if ([".exe", ".com", ".js", ".mjs", ".cjs"].includes(extension)) {
    return await isExecutable(candidate) ? realpath(candidate) : undefined;
  }
  const entrypoint = WINDOWS_NPM_ENTRYPOINTS[descriptor.id];
  if (!entrypoint) return undefined;
  const binDirectory = path.dirname(candidate);
  const targets = [
    path.resolve(binDirectory, "..", ...entrypoint),
    path.resolve(binDirectory, "node_modules", ...entrypoint)
  ];
  for (const target of targets) {
    if (await isExecutable(target)) return realpath(target);
  }
  return undefined;
}

export function installedHarnessCandidates(descriptor: HarnessDescriptor): string[] {
  const relative = descriptor.id === "claude-code"
    ? path.join("claude code", "node_modules", ".bin", "claude")
    : path.join(descriptor.id, "node_modules", ".bin", descriptor.defaultCommand);
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.basename(process.cwd()) === "server"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
  const explicitRoot = process.env.SCIENCEEVOLVE_HARNESS_ROOT?.trim();
  const roots = [...new Set([
    path.resolve(projectRoot, "harness"),
    path.resolve(moduleDirectory, "..", "..", "..", "harness"),
    ...(explicitRoot ? [path.resolve(explicitRoot)] : [])
  ])];
  return roots.map((root) => path.join(root, relative));
}

export async function executableFingerprint(executable: string): Promise<string> {
  const info = await stat(executable);
  return createHash("sha256")
    .update(`${await realpath(executable)}\0${info.size}\0${info.mtimeMs}`)
    .digest("hex");
}

async function isExecutable(candidate: string): Promise<boolean> {
  try {
    await access(candidate, fsConstants.X_OK);
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

export function isRejectedHarnessExecutable(
  descriptor: HarnessDescriptor,
  value: string
): boolean {
  return descriptor.default === true &&
    /(?:^|[\\/])\.runtime[\\/]codex(?:-aigw)?[\\/]codex$/.test(value);
}

/** Trusted catalog capability, independent of product dispatch rules. */
export function harnessSupportsNativeProfile(harnessId: HarnessId): boolean {
  return harnessCatalogRegistry.has(harnessId) &&
    harnessCatalogRegistry.descriptor(harnessId).route?.nativeProfileAuth === true;
}
