/** Standard MCP service used by process tests without any model calls. */
export function projectMcpSource(version: string): string {
  return `
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const server = new Server({ name: 'task-evidence', version: '1' }, { capabilities: { tools: {}, resources: {}, prompts: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: 'evidence', description: 'Inspect task evidence', inputSchema: { type: 'object', properties: { wait: { type: 'boolean' } } } }] }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.arguments?.wait) await new Promise(resolve => setTimeout(resolve, 60000));
  return { content: [{ type: 'text', text: JSON.stringify({ version: ${JSON.stringify(version)}, pid: process.pid, cwd: process.cwd(), label: process.env.TASK_LABEL, unmapped: process.env.SCIENCEEVOLVE_UNMAPPED_SECRET }) }] };
});
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [{ uri: 'task://evidence', name: 'Evidence' }] }));
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({ resourceTemplates: [] }));
server.setRequestHandler(ReadResourceRequestSchema, async () => ({ contents: [{ uri: 'task://evidence', text: ${JSON.stringify(version)} }] }));
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [{ name: 'review' }] }));
server.setRequestHandler(GetPromptRequestSchema, async () => ({ messages: [{ role: 'user', content: { type: 'text', text: ${JSON.stringify(version)} } }] }));
server.connect(new StdioServerTransport());
process.stdin.on('end', () => { server.close().finally(() => process.exit()); });
`;
}
