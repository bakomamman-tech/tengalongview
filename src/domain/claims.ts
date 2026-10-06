import type { EvidenceRecord, PatternResult, ProfileDraft } from "../types.js";

export function validateSourcedPattern(pattern: PatternResult, evidence: EvidenceRecord[]): string[] {
  const known = new Set(evidence.map((e) => e.id));
  const errors: string[] = [];
  if (pattern.kind !== "insufficient_evidence" && pattern.evidenceIds.length === 0) {
    errors.push("A learner claim must cite at least one evidence record.");
  }
  for (const id of pattern.evidenceIds) {
    if (!known.has(id)) errors.push(`Unknown evidence reference: ${id}`);
  }
  return errors;
}

export function createProfileDraft(pattern: PatternResult): ProfileDraft {
  if (pattern.kind === "insufficient_evidence") {
    throw new Error("Cannot create a strength/struggle claim from insufficient evidence.");
  }
  if (!pattern.evidenceIds.length) throw new Error("Unsourced learner claims are forbidden.");
  return {
    id: `draft-${Date.now()}`,
    learnerId: pattern.learnerId,
    subject: pattern.subject,
    statement: pattern.statement,
    evidenceIds: [...pattern.evidenceIds],
    status: "pending_review",
    createdAt: new Date().toISOString(),
  };
}

export function assertNoRankingOrTrack(text: string): void {
  const forbidden = [
    /rank(ed|ing)?\s+(against|among|in class)/i,
    /top\s+\d+/i,
    /bottom\s+\d+/i,
    /assign(ed)?\s+(a\s+)?track/i,
    /must\s+(choose|study|become)/i,
  ];
  if (forbidden.some((rule) => rule.test(text))) {
    throw new Error("Profile text contains prohibited ranking or prescriptive pathway language.");
  }
}
