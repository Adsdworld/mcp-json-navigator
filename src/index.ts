import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerJsonTools } from "./tools/json/jsonTools.js";

const server = new McpServer({
    name: "json-explorer",
    version: "1.0.0",
    capabilities: { tools: {} }
});

registerJsonTools(server);

await server.connect(new StdioServerTransport());
console.error("✅ JSON explorer MCP is running");
