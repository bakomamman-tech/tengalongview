import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import path from "node:path";

let filesystemClient: Client | null = null;

export async function getFilesystemMcpClient(): Promise<Client> {
  if (filesystemClient) return filesystemClient;

  const allowedDir = path.resolve(process.cwd(), process.env.IMPORTED_RECORDS_DIR ?? "data/imported");
  const command = process.env.FILESYSTEM_MCP_COMMAND ?? "npx";
  const args = process.env.FILESYSTEM_MCP_ARGS
    ? process.env.FILESYSTEM_MCP_ARGS.split(" ").filter(Boolean)
    : ["-y", "@modelcontextprotocol/server-filesystem", allowedDir];

  filesystemClient = new Client({ name: "tengalongview-filesystem-client", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command,
    args,
    env: process.env as Record<string, string>,
  });
  await filesystemClient.connect(transport);
  return filesystemClient;
}

export async function readImportedSourceNote(learnerId: string): Promise<{ path: string; text: string }> {
  const allowedDir = path.resolve(process.cwd(), process.env.IMPORTED_RECORDS_DIR ?? "data/imported");
  const filePath = path.join(allowedDir, `${learnerId}-source-note.txt`);
  const client = await getFilesystemMcpClient();
  const result = await client.callTool({ name: "read_text_file", arguments: { path: filePath } });
  if (result.isError) throw new Error(`Filesystem MCP read failed: ${JSON.stringify(result.content)}`);
  const item = Array.isArray(result.content) ? result.content.find((x: any) => x.type === "text") : undefined;
  if (!item || typeof item.text !== "string") throw new Error("Filesystem MCP returned no text payload.");
  return { path: filePath, text: item.text };
}
