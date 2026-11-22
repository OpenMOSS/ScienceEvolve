import { zodToJsonSchema } from "zod-to-json-schema";
import { gateRequestSchema } from "./workflow-gate.js";
import type { RuntimeMcpToolDefinition } from "./harness-runtime/contracts.js";

export function workflowGateTools(): RuntimeMcpToolDefinition[] {
  return [{ name: "workflow_gate", description: "Read configured Gate checks with list. For a code Gate, prepare returns the exact command: run it with your native Shell in this original task before finishing, then read the captured actual tool result. Never substitute a self-reported score or rerun an unknown/completed check. For an Agent Gate, only its configured checker may report the result. choose selects one configured outgoing path; hard rules are enforced against the bound result. This does not finish your task or bypass normal Git delivery.",
    inputSchema: zodToJsonSchema(gateRequestSchema, { $refStrategy: "none" }) as Record<string, unknown> }];
}
