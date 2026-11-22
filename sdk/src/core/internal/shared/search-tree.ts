import { z } from "zod";

export const searchTreeId = z.string().min(1).max(128).regex(/^[\p{L}\p{N}][\p{L}\p{N}_.-]*$/u);
const text = z.string().trim().min(1).max(16_000);
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const file = z.string().min(1).max(1024).refine(value => !value.includes("\\") && !value.includes("\0") &&
  !value.startsWith("/") && value.split("/").every(part => part && part !== "." && part !== ".."), "Expected a relative input file path");
const description = z.string().max(16_000).optional();
const direction = z.object({ id: searchTreeId, kind: z.literal("direction"), parentId: searchTreeId, name: text, description }).strict();
const candidate = z.object({
  id: searchTreeId, kind: z.literal("candidate"), parentId: searchTreeId, name: text, description,
  goal: text, source: text, change: text.optional(), parameters: z.record(z.unknown()).optional(),
  version: z.discriminatedUnion("status", [
    z.object({ status: z.literal("uncommitted") }).strict(),
    z.object({ status: z.literal("committed"), commit: sha }).strict()
  ]),
  execution: z.object({ status: z.enum(["not_started", "running", "succeeded", "failed", "unknown"]),
    details: text.optional() }).strict(),
  result: z.unknown().optional(), evidence: z.array(text).max(100).optional(), evaluation: z.unknown().optional()
}).strict();
export const searchTreeNodeSchema = z.discriminatedUnion("kind", [direction, candidate]);
export type SearchTreeNode = z.infer<typeof searchTreeNodeSchema>;
export const searchTreeConfigSchema = z.object({
  root: z.object({ name: text, description, inputFiles: z.array(file).max(1000).optional() }).strict(),
  directions: z.array(direction).max(2000)
}).strict().superRefine((config, context) => {
  try { validateNodes(config.directions); }
  catch (error) { context.addIssue({ code: "custom", message: (error as Error).message }); }
});
export type SearchTreeConfig = z.infer<typeof searchTreeConfigSchema>;
export function validateNodes(nodes: SearchTreeNode[]) {
  const map = new Map(nodes.map(node => [node.id, node]));
  if (map.size !== nodes.length || map.has("root")) throw new Error("Search tree node identities must be unique; root is reserved");
  for (const node of nodes) {
    const visited = new Set([node.id]);
    let parent = node.parentId;
    while (parent !== "root") {
      if (visited.has(parent)) throw new Error(`Search tree cycle at ${node.id}`);
      visited.add(parent);
      const ancestor = map.get(parent);
      if (!ancestor) throw new Error(`Search tree parent ${parent} does not exist`);
      if (node.kind === "direction" && ancestor.kind !== "direction") throw new Error("Directions cannot descend from candidates");
      parent = ancestor.parentId;
    }
    if (node.kind === "candidate" && node.parentId === "root") throw new Error("A candidate must belong to a direction or candidate");
    if (node.kind === "candidate" && node.execution.status === "succeeded" && !node.evidence?.length)
      throw new Error(`Candidate ${node.id}: succeeded requires execution evidence`);
    if (node.kind === "candidate" && node.execution.status === "not_started" && (node.result !== undefined || node.evaluation !== undefined))
      throw new Error(`Candidate ${node.id}: unexecuted ideas cannot carry experimental results or evaluations`);
  }
}
