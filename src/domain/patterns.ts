import type { EvidenceRecord, PatternResult } from "../types.js";

function pct(record: EvidenceRecord): number | null {
  if (typeof record.score !== "number" || typeof record.maxScore !== "number" || record.maxScore <= 0) return null;
  return (record.score / record.maxScore) * 100;
}

export function analyseLongitudinalPattern(
  learnerId: string,
  subject: string,
  evidence: EvidenceRecord[],
): PatternResult {
  const rows = evidence
    .filter((e) => e.learnerId === learnerId && e.subject?.toLowerCase() === subject.toLowerCase())
    .map((e) => ({ record: e, percent: pct(e) }))
    .filter((x): x is { record: EvidenceRecord; percent: number } => x.percent !== null)
    .sort((a, b) => new Date(a.record.date).getTime() - new Date(b.record.date).getTime());

  const warnings: string[] = [];
  if (rows.length < 3) {
    return {
      learnerId,
      subject,
      kind: "insufficient_evidence",
      confidence: "low",
      statement: `Insufficient evidence to claim a sustained ${subject} pattern.`,
      evidenceIds: rows.map((r) => r.record.id),
      metrics: { observations: rows.length },
      warnings: ["At least three scored observations are required for a longitudinal claim."],
    };
  }

  const values = rows.map((r) => r.percent);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const diffs = values.slice(1).map((v, i) => v - values[i]);
  const negatives = diffs.filter((d) => d < 0).length / diffs.length;
  const positives = diffs.filter((d) => d > 0).length / diffs.length;
  const mostlyHigh = values.filter((v) => v >= 70).length / values.length;
  const mostlyLow = values.filter((v) => v < 55).length / values.length;

  let kind: PatternResult["kind"] = "mixed";
  let statement = `${subject} evidence is mixed; no sustained pattern is supported yet.`;
  let consistency = Math.max(negatives, positives);

  if (delta <= -10 && negatives >= 0.66) {
    kind = "sustained_decline";
    statement = `${subject} performance shows a sustained decline across ${rows.length} sourced assessments.`;
    consistency = negatives;
  } else if (delta >= 10 && positives >= 0.66) {
    kind = "sustained_improvement";
    statement = `${subject} performance shows sustained improvement across ${rows.length} sourced assessments.`;
    consistency = positives;
  } else if (avg >= 75 && mostlyHigh >= 0.8) {
    kind = "stable_strength";
    statement = `${subject} performance shows a stable strength across ${rows.length} sourced assessments.`;
    consistency = mostlyHigh;
  } else if (avg < 50 && mostlyLow >= 0.8) {
    kind = "stable_struggle";
    statement = `${subject} performance shows a recurring struggle across ${rows.length} sourced assessments.`;
    consistency = mostlyLow;
  }

  const confidence = rows.length >= 5 && consistency >= 0.75 ? "high" : kind === "mixed" ? "low" : "medium";
  if (rows.some((r, i) => i > 0 && new Date(r.record.recordedAt) < new Date(rows[i - 1].record.recordedAt))) {
    warnings.push("One or more records were logged out of chronological order; analysis uses assessment date.");
  }

  return {
    learnerId,
    subject,
    kind,
    confidence,
    statement,
    evidenceIds: rows.map((r) => r.record.id),
    metrics: {
      observations: rows.length,
      averagePercent: Number(avg.toFixed(1)),
      firstPercent: Number(first.toFixed(1)),
      lastPercent: Number(last.toFixed(1)),
      deltaPercent: Number(delta.toFixed(1)),
      directionalConsistency: Number(consistency.toFixed(2)),
    },
    warnings,
  };
}
