import pg from "pg";
import type { EvidenceRecord, Learner, ProfileDraft } from "../types.js";

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS learners (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      current_level TEXT NOT NULL,
      synthetic BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      type TEXT NOT NULL,
      subject TEXT,
      academic_year TEXT NOT NULL,
      term INTEGER NOT NULL,
      date DATE NOT NULL,
      score DOUBLE PRECISION,
      max_score DOUBLE PRECISION,
      attendance_percent DOUBLE PRECISION,
      note TEXT,
      recorded_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profile_drafts (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL REFERENCES learners(id),
      subject TEXT NOT NULL,
      statement TEXT NOT NULL,
      evidence_ids JSONB NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profile_updates (
      id BIGSERIAL PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES profile_drafts(id),
      learner_id TEXT NOT NULL REFERENCES learners(id),
      teacher_name TEXT NOT NULL,
      decision TEXT NOT NULL,
      final_statement TEXT NOT NULL,
      committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      tool_name TEXT NOT NULL,
      input_json JSONB NOT NULL,
      output_json JSONB NOT NULL,
      human_approver TEXT,
      approval_status TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function upsertLearner(learner: Learner): Promise<void> {
  await pool.query(
    `INSERT INTO learners(id, display_name, current_level, synthetic)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(id) DO UPDATE SET display_name=EXCLUDED.display_name,current_level=EXCLUDED.current_level,synthetic=EXCLUDED.synthetic`,
    [learner.id, learner.displayName, learner.currentLevel, learner.synthetic],
  );
}

export async function upsertEvidence(e: EvidenceRecord): Promise<void> {
  await pool.query(
    `INSERT INTO evidence(id, learner_id, type, subject, academic_year, term, date, score, max_score, attendance_percent, note, recorded_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT(id) DO NOTHING`,
    [e.id,e.learnerId,e.type,e.subject ?? null,e.academicYear,e.term,e.date,e.score ?? null,e.maxScore ?? null,e.attendancePercent ?? null,e.note ?? null,e.recordedAt],
  );
}

export async function getLearnerHistory(learnerId: string): Promise<{ learner: Learner | null; evidence: EvidenceRecord[] }> {
  const lr = await pool.query(`SELECT id, display_name, current_level, synthetic FROM learners WHERE id=$1`, [learnerId]);
  const ev = await pool.query(`SELECT * FROM evidence WHERE learner_id=$1 ORDER BY date ASC`, [learnerId]);
  const learner = lr.rows[0] ? {
    id: lr.rows[0].id,
    displayName: lr.rows[0].display_name,
    currentLevel: lr.rows[0].current_level,
    synthetic: lr.rows[0].synthetic,
  } : null;
  const evidence = ev.rows.map((r) => ({
    id:r.id, learnerId:r.learner_id, type:r.type, subject:r.subject ?? undefined,
    academicYear:r.academic_year, term:r.term, date:new Date(r.date).toISOString().slice(0,10),
    score:r.score ?? undefined, maxScore:r.max_score ?? undefined, attendancePercent:r.attendance_percent ?? undefined,
    note:r.note ?? undefined, recordedAt:new Date(r.recorded_at).toISOString(),
  })) as EvidenceRecord[];
  return { learner, evidence };
}

export async function saveDraft(draft: ProfileDraft): Promise<void> {
  await pool.query(
    `INSERT INTO profile_drafts(id,learner_id,subject,statement,evidence_ids,status,created_at)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT(id) DO NOTHING`,
    [draft.id,draft.learnerId,draft.subject,draft.statement,JSON.stringify(draft.evidenceIds),draft.status,draft.createdAt],
  );
}

export async function getDraft(draftId: string): Promise<ProfileDraft | null> {
  const r = await pool.query(`SELECT * FROM profile_drafts WHERE id=$1`, [draftId]);
  if (!r.rows[0]) return null;
  const d = r.rows[0];
  return { id:d.id, learnerId:d.learner_id, subject:d.subject, statement:d.statement, evidenceIds:d.evidence_ids, status:d.status, createdAt:new Date(d.created_at).toISOString() };
}

export async function commitDraft(draft: ProfileDraft, teacherName: string, decision: "approved" | "modified", finalStatement: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE profile_drafts SET status='approved' WHERE id=$1`, [draft.id]);
    await client.query(`INSERT INTO profile_updates(draft_id,learner_id,teacher_name,decision,final_statement) VALUES($1,$2,$3,$4,$5)`, [draft.id,draft.learnerId,teacherName,decision,finalStatement]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function logTool(toolName: string, input: unknown, output: unknown, humanApprover?: string, approvalStatus?: string): Promise<void> {
  await pool.query(`INSERT INTO audit_logs(tool_name,input_json,output_json,human_approver,approval_status) VALUES($1,$2,$3,$4,$5)`, [toolName, JSON.stringify(input), JSON.stringify(output), humanApprover ?? null, approvalStatus ?? null]);
}
