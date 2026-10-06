import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { initSchema } from "../data/store.js";
import { analysePatternTool, commitProfileTool, draftProfileTool, getLearnerHistoryTool } from "./tools.js";

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function createServer(): McpServer {
  const server = new McpServer({ name: "tengalongview-learner-profile", version: "0.1.0" });

  server.registerTool(
    "get_learner_history",
    { description: "Retrieve one learner's longitudinal evidence.", inputSchema: z.object({ learnerId: z.string() }) },
    async (args) => text(await getLearnerHistoryTool(args)),
  );

  server.registerTool(
    "analyse_longitudinal_pattern",
    { description: "Analyse a sourced subject pattern across terms and years.", inputSchema: z.object({ learnerId: z.string(), subject: z.string() }) },
    async (args) => text(await analysePatternTool(args)),
  );

  server.registerTool(
    "draft_profile_update",
    { description: "Create a sourced learner-profile draft for teacher review.", inputSchema: z.object({ learnerId: z.string(), subject: z.string() }) },
    async (args) => text(await draftProfileTool(args)),
  );

  server.registerTool(
    "commit_profile_update",
    {
      description: "Commit only an approved or teacher-modified profile update.",
      inputSchema: z.object({
        draftId: z.string(),
        teacherName: z.string(),
        decision: z.enum(["approved", "modified", "rejected"]),
        modifiedStatement: z.string().optional(),
      }),
    },
    async (args) => text(await commitProfileTool(args)),
  );

  return server;
}

await initSchema();
console.error("TengaLongView MCP server ready on stdio");
void serveStdio(createServer);
