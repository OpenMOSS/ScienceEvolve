import type {
  HarnessId,
  HarnessRuntimeToolCatalog,
  RuntimeMcpToolDefinition
} from "./contracts.js";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactName(value: unknown, field: string): string {
  if (typeof value !== "string" || !value || value.trim() !== value ||
    /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`${field} must be a non-empty, unmodified runtime name`);
  }
  return value;
}

/**
 * Pi's explicit registration surface uses this qualified
 * form. Codex and DSH remain responsible for their native namespace display;
 * the common catalog never pretends those native representations are equal.
 */
export function modelFacingMcpToolName(namespace: string, rawName: string): string {
  return `mcp__${exactName(namespace, "MCP namespace")}__${exactName(rawName, "MCP tool name")}`;
}

/**
 * Compile a model-facing catalog from the definitions returned by tools/list.
 * The function validates but never aliases names, supplies guessed schemas, or
 * rewrites required fields.
 */
export function compileRuntimeMcpToolCatalog(input: {
  harnessId: HarnessId;
  namespace: string;
  tools: readonly RuntimeMcpToolDefinition[];
}): HarnessRuntimeToolCatalog {
  const harnessId = exactName(input.harnessId, "Harness ID");
  const namespace = exactName(input.namespace, "MCP namespace");
  const rawNames = new Set<string>();
  const tools = input.tools.map((source, index) => {
    if (!record(source)) throw new Error(`MCP tools/list entry ${index} is not an object`);
    const rawName = exactName(source.name, `MCP tools/list entry ${index} name`);
    if (!record(source.inputSchema)) {
      throw new Error(`MCP tool ${rawName} omitted its runtime inputSchema`);
    }
    if (source.description !== undefined && typeof source.description !== "string") {
      throw new Error(`MCP tool ${rawName} has an invalid description`);
    }
    if (source.outputSchema !== undefined && !record(source.outputSchema)) {
      throw new Error(`MCP tool ${rawName} has an invalid outputSchema`);
    }
    if (source.annotations !== undefined && !record(source.annotations)) {
      throw new Error(`MCP tool ${rawName} has invalid annotations`);
    }
    if (rawNames.has(rawName)) {
      throw new Error(`MCP server ${namespace} listed duplicate tool ${rawName}`);
    }
    rawNames.add(rawName);
    return Object.freeze({
      name: rawName,
      namespace,
      ...(source.description === undefined ? {} : { description: source.description }),
      inputSchema: Object.freeze(structuredClone(source.inputSchema)),
      ...(source.outputSchema === undefined
        ? {}
        : { outputSchema: Object.freeze(structuredClone(source.outputSchema)) }),
      ...(source.annotations === undefined
        ? {}
        : { annotations: Object.freeze(structuredClone(source.annotations)) })
    });
  });
  return Object.freeze({
    schemaVersion: 1,
    harnessId,
    source: "runtime-tools-list",
    naming: "runtime-name-verbatim",
    errorDelivery: "same-native-turn-structured",
    tools: Object.freeze(tools)
  });
}

/** Preserve the complete MCP isError result in the native tool-error message. */
export function structuredMcpToolError(result: unknown): Error {
  const encoded = JSON.stringify(result);
  if (encoded === undefined) {
    throw new Error("MCP tool returned a non-JSON error result");
  }
  return new Error(encoded);
}
