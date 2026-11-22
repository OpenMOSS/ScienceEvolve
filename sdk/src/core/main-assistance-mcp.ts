import { zodToJsonSchema } from "zod-to-json-schema";
import { mainAssistanceRequestSchema, userReplySchema } from "./main-assistance.js";
export function replyToUserTool() {
  return { name: "reply_to_user", description: "Reply to the user message actually received by this Main invocation. Use its messageId. A user reply does not complete the workflow or change a task.",
    inputSchema: zodToJsonSchema(userReplySchema, { target: "jsonSchema7", $refStrategy: "none" }) };
}
export function mainAssistanceTools() {
  return [{ name: "main_assistance", description: "Request Main asynchronously during your original task (operation=request, question, stable requestId), then continue working. list/read inspect only your original task's requests and retained answers. Queued is not Main receipt or a reply. Main uses operation=reply with its exact requestId and text. Assistance never routes, replaces, completes or reopens the requesting task.",
    inputSchema: zodToJsonSchema(mainAssistanceRequestSchema, { target: "jsonSchema7", $refStrategy: "none" }) }];
}
