import type { PatternResult } from "../types.js";
import { assertNoRankingOrTrack } from "../domain/claims.js";

export interface PatternExplanation {
  text: string;
  generatedBy: "deterministic" | "open_weights";
  model: string | null;
}

export async function explainPattern(pattern: PatternResult): Promise<PatternExplanation> {
  if (process.env.USE_OPEN_WEIGHTS_LLM !== "true") {
    return {
      text: pattern.statement,
      generatedBy: "deterministic",
      model: null,
    };
  }

  const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b";
  const prompt = `You are drafting one cautious sentence for a teacher about ONE learner.
Rules:
- Use only the supplied structured pattern.
- Do not diagnose, rank, label, assign a track, or prescribe a career.
- Mention that the finding is based on cited assessments.
- Do not invent evidence.
Pattern JSON: ${JSON.stringify(pattern)}`;

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Open-weights model request failed: ${res.status}${detail ? ` — ${detail}` : ""}`);
  }

  const body = await res.json() as { message?: { content?: string } };
  const text = body.message?.content?.trim();
  if (!text) throw new Error("Open-weights model returned an empty response.");

  assertNoRankingOrTrack(text);

  return {
    text,
    generatedBy: "open_weights",
    model,
  };
}
