import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

let client: Client | null = null;

export async function getMcpClient(): Promise<Client> {
  if (client) return client;
  client = new Client({ name: "tengalongview-agent", version: "0.1.0" });
  const command = process.env.MCP_SERVER_COMMAND ?? "node";
  const args = (process.env.MCP_SERVER_ARGS ?? "dist/src/mcp/server.js").split(" ").filter(Boolean);
  const transport = new StdioClientTransport({ command, args, env: process.env as Record<string, string> });
  await client.connect(transport);
  return client;
}

export async function callJsonTool(name: string, args: Record<string, unknown>): Promise<any> {
  const c = await getMcpClient();
  const result = await c.callTool({ name, arguments: args });
  if (result.isError) throw new Error(`MCP tool ${name} failed: ${JSON.stringify(result.content)}`);

  const item = Array.isArray(result.content)
    ? result.content.find((block) => block.type === "text")
    : undefined;

  if (!item || item.type !== "text" || typeof item.text !== "string") {
    throw new Error(`Tool ${name} returned no text payload.`);
  }

  return JSON.parse(item.text);
}
