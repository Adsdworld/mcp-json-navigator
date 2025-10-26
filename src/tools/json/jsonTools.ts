import { z } from "zod";
import { exploreJson, queryJson } from "./json.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers all JSON tools into the MCP server instance.
 */
export function registerJsonTools(server: McpServer) {

    server.tool(
        "json-explore",
        "Explore a JSON file",
        {
            filepath: z.string(),
            jsonpath: z.string().optional(),
            verbosity: z.number().min(0).max(5).default(4),
            listDisplayLimit: z.number().optional(),
            objectDisplayLimit: z.number().optional(),
            charDisplayLimit: z.number().optional()
        },
        ({ filepath, jsonpath, verbosity, listDisplayLimit, objectDisplayLimit, charDisplayLimit }) => ({
            content: [
                {
                    type: "text",
                    text: JSON.stringify(exploreJson(filepath, jsonpath, verbosity, listDisplayLimit, objectDisplayLimit, charDisplayLimit), null, 2)
                }
            ]
        })
    );

    server.tool(
        "json-query",
        "Query for matching keys or values inside a JSON file query can be case sensitive",
        {
            filepath: z.string(),
            query: z.string(),
            limit: z.number().min(10).optional().default(20),
            caseSensitive: z.boolean().optional().default(false),
        },
        ({ filepath, query, limit, caseSensitive }) => {
            const results = JSON.stringify(queryJson(filepath, query, limit, caseSensitive), null, 2);
            return { content: [{ type: "text", text: results }] };
        }
    );
}
