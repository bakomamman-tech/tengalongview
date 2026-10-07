import express from "express";
import cors from "cors";
import path from "node:path";
import { initSchema } from "../data/store.js";
import { runProfileUpdate } from "../agent/workflow.js";
import { callJsonTool } from "../agent/mcpClient.js";

await initSchema();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "public")));

app.get("/health", (_req, res) => res.json({ ok: true, service: "TengaLongView", version: "0.1.0" }));

app.post("/api/agent/run", async (req, res) => {
  try {
    const learnerId = String(req.body?.learnerId ?? "").trim();
    const subject = String(req.body?.subject ?? "").trim();
    if (!learnerId || !subject) return res.status(400).json({ error: "learnerId and subject are required" });
    res.json(await runProfileUpdate(learnerId, subject));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Learner not found.") ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

app.post("/api/agent/decision", async (req, res) => {
  try {
    const { draftId, teacherName, decision, modifiedStatement } = req.body ?? {};
    if (!draftId || !teacherName || !decision) return res.status(400).json({ error: "draftId, teacherName and decision are required" });
    res.json(await callJsonTool("commit_profile_update", { draftId, teacherName, decision, modifiedStatement }));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`TengaLongView listening on http://localhost:${port}`));
