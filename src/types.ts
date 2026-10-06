export type EvidenceType = "quiz" | "assignment" | "exam" | "attendance" | "teacher_note" | "project";

export interface Learner {
  id: string;
  displayName: string;
  currentLevel: string;
  synthetic: boolean;
}

export interface EvidenceRecord {
  id: string;
  learnerId: string;
  type: EvidenceType;
  subject?: string;
  academicYear: string;
  term: number;
  date: string;
  score?: number;
  maxScore?: number;
  attendancePercent?: number;
  note?: string;
  recordedAt: string;
}

export type PatternKind =
  | "sustained_improvement"
  | "sustained_decline"
  | "stable_strength"
  | "stable_struggle"
  | "mixed"
  | "insufficient_evidence";

export interface PatternResult {
  learnerId: string;
  subject: string;
  kind: PatternKind;
  confidence: "high" | "medium" | "low";
  statement: string;
  evidenceIds: string[];
  metrics: {
    observations: number;
    averagePercent?: number;
    firstPercent?: number;
    lastPercent?: number;
    deltaPercent?: number;
    directionalConsistency?: number;
  };
  warnings: string[];
}

export interface ProfileDraft {
  id: string;
  learnerId: string;
  subject: string;
  statement: string;
  evidenceIds: string[];
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
}
