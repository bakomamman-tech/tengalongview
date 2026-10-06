import type { PatternResult } from "../types.js";
import { assertNoRankingOrTrack } from "../domain/claims.js";

export async function explainPattern(pattern: PatternResult): Promise<string> {
  if (process.env.USE_OPEN_WEIGHTS_LLM !== "true") return pattern.statement;
  const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
  const prompt = `You are drafting one cautious sentence for a teacher about ONE learner.\nRules:\n- Use only the supplied structured pattern.\n- Do not diagnose, rank, label, assign a track, or prescribe a career.\n- Mention that the finding is based on cited assessments.\n- Do not invent evidence.\nPattern JSON: ${JSON.stringify(pattern)}`;
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, stream: false, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Open-weights model request failed: ${res.status}`);
  const body = await res.json() as { message?: { content?: string } };
  const text = body.message?.content?.trim();
  if (!text) throw new Error("Open-weights model returned an empty response.");
  assertNoRankingOrTrack(text);
  return text;
}
