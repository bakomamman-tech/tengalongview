import test from "node:test";
import assert from "node:assert/strict";
import { analyseLongitudinalPattern } from "../src/domain/patterns.js";
import { assertNoRankingOrTrack, createProfileDraft, validateSourcedPattern } from "../src/domain/claims.js";
import type { EvidenceRecord } from "../src/types.js";

const mk = (id:string, score:number, date:string):EvidenceRecord => ({ id, learnerId:"S1", type:"quiz", subject:"Math", academicYear:"2025/26", term:1, date, score, maxScore:100, recordedAt:`${date}T12:00:00Z` });

test("detects a sustained decline and cites all evidence", () => {
  const ev=[mk("e1",78,"2025-01-01"),mk("e2",70,"2025-03-01"),mk("e3",62,"2025-06-01"),mk("e4",55,"2025-09-01")];
  const p=analyseLongitudinalPattern("S1","Math",ev);
  assert.equal(p.kind,"sustained_decline");
  assert.deepEqual(p.evidenceIds,["e1","e2","e3","e4"]);
  assert.deepEqual(validateSourcedPattern(p,ev),[]);
});

test("one or two scores are insufficient for a longitudinal claim",()=>{
  const p=analyseLongitudinalPattern("S1","Math",[mk("e1",30,"2025-01-01"),mk("e2",20,"2025-03-01")]);
  assert.equal(p.kind,"insufficient_evidence");
  assert.throws(()=>createProfileDraft(p));
});

test("blocks ranking or prescriptive pathway language",()=>{
  assert.throws(()=>assertNoRankingOrTrack("This learner is ranked among the top 5 in class."));
  assert.throws(()=>assertNoRankingOrTrack("The learner must become an engineer."));
  assert.doesNotThrow(()=>assertNoRankingOrTrack("The evidence shows sustained improvement across four assessments."));
});

test("rejects unsourced and fabricated evidence references", () => {
  const evidence = [
    mk("e1", 78, "2025-01-01"),
    mk("e2", 82, "2025-03-01"),
    mk("e3", 88, "2025-06-01"),
  ];

  const unsourced = {
    learnerId: "S1",
    subject: "Math",
    kind: "sustained_improvement" as const,
    confidence: "medium" as const,
    statement: "Math performance shows sustained improvement.",
    evidenceIds: [],
    metrics: { observations: 3 },
    warnings: [],
  };

  assert.deepEqual(
    validateSourcedPattern(unsourced, evidence),
    ["A learner claim must cite at least one evidence record."],
  );

  assert.throws(
    () => createProfileDraft(unsourced),
    /Unsourced learner claims are forbidden/,
  );

  const fabricatedReference = {
    ...unsourced,
    evidenceIds: ["E-NOT-REAL"],
  };

  assert.deepEqual(
    validateSourcedPattern(fabricatedReference, evidence),
    ["Unknown evidence reference: E-NOT-REAL"],
  );
});

