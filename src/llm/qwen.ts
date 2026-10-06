import type { PatternResult } from "../types.js";
import { assertNoRankingOrTrack } from "../domain/claims.js";

export interface PatternExplanation {
  text: string;
  generatedBy: "deterministic" | "open_weights";
  model: string | null;
}

function validateModelWording(text: string, pattern: PatternResult): void {
  assertNoRankingOrTrack(text);

  const forbidden = [
    /percentile/i,
    /directional consistency/i,
    /\baverage\b/i,
    /%/,
    /\bimmediate\b/i,
    /\burgent\b/i,
    /\bconcern\b/i,
    /\bwarrant/i,
    /\brecommend/i,
    /\bintervention\b/i,
  ];

  if (forbidden.some((rule) => rule.test(text))) {
    throw new Error("Open-weights wording introduced unsupported metrics, urgency, or recommendations.");
  }

  if (!text.toLowerCase().includes(pattern.subject.toLowerCase())) {
    throw new Error("Open-weights wording omitted the subject.");
  }

  if (!/assessment/i.test(text)) {
    throw new Error("Open-weights wording must mention the assessment evidence basis.");
  }

  if (pattern.kind === "sustained_decline" && !/(declin|decreas|downward)/i.test(text)) {
    throw new Error("Open-weights wording changed the direction of the deterministic pattern.");
  }

  if (pattern.kind === "sustained_improvement" && !/(improv|increas|upward)/i.test(text)) {
    throw new Error("Open-weights wording changed the direction of the deterministic pattern.");
  }
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
  const safeInput = {
    subject: pattern.subject,
    kind: pattern.kind,
    confidence: pattern.confidence,
    coreStatement: pattern.statement,
    evidenceIds: pattern.evidenceIds,
  };

  const prompt = `Rewrite the supplied core statement as ONE cautious teacher-facing sentence.

Hard rules:
- Preserve the meaning of the core statement exactly.
- Mention that the conclusion is based on sourced assessments.
- Do not introduce any numeric metric, percentage, percentile, average, trend statistic, threshold, urgency, concern level, intervention, or recommendation.
- Do not diagnose, rank, label, assign a track, or prescribe a career.
- Do not invent evidence.
- Output only the single sentence, with no preamble.

Safe input JSON: ${JSON.stringify(safeInput)}`;

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

  validateModelWording(text, pattern);

  return {
    text,
    generatedBy: "open_weights",
    model,
  };
}
