import fs from "node:fs/promises";
import path from "node:path";
import { initSchema, pool, upsertEvidence, upsertLearner } from "./store.js";
import type { EvidenceRecord, Learner } from "../types.js";

const file = path.resolve(process.cwd(), "data/synthetic/learner-records.json");
const raw = JSON.parse(await fs.readFile(file, "utf8")) as { learners: Learner[]; evidence: EvidenceRecord[] };
await initSchema();
for (const learner of raw.learners) await upsertLearner(learner);
for (const evidence of raw.evidence) await upsertEvidence(evidence);
console.log(`Seeded ${raw.learners.length} synthetic learners and ${raw.evidence.length} evidence records.`);
await pool.end();
