import { analyseLongitudinalPattern } from "../domain/patterns.js";
import { assertNoRankingOrTrack, createProfileDraft, validateSourcedPattern } from "../domain/claims.js";
import { commitDraft, getDraft, getLearnerHistory, logTool, saveDraft } from "../data/store.js";
import { explainPattern } from "../llm/qwen.js";

export async function getLearnerHistoryTool(input: { learnerId: string }) {
  const output = await getLearnerHistory(input.learnerId);
  await logTool("get_learner_history", input, output);
  return output;
}

export async function analysePatternTool(input: { learnerId: string; subject: string }) {
  const history = await getLearnerHistory(input.learnerId);
  if (!history.learner) throw new Error("Learner not found.");
  const output = analyseLongitudinalPattern(input.learnerId, input.subject, history.evidence);
  const errors = validateSourcedPattern(output, history.evidence);
  if (errors.length) throw new Error(errors.join(" "));
  await logTool("analyse_longitudinal_pattern", input, output);
  return output;
}

export async function draftProfileTool(input: { learnerId: string; subject: string }) {
  const history = await getLearnerHistory(input.learnerId);
  if (!history.learner) throw new Error("Learner not found.");

  const pattern = analyseLongitudinalPattern(input.learnerId, input.subject, history.evidence);
  const errors = validateSourcedPattern(pattern, history.evidence);
  if (errors.length) throw new Error(errors.join(" "));

  const draft = createProfileDraft(pattern);
  const explanation = await explainPattern(pattern);
  draft.statement = explanation.text;
  assertNoRankingOrTrack(draft.statement);

  const output = {
    ...draft,
    generatedBy: explanation.generatedBy,
    model: explanation.model,
    ...(explanation.fallbackReason ? { fallbackReason: explanation.fallbackReason } : {}),
  };

  if (explanation.generatedBy === "open_weights") {
    await logTool(
      "open_weights_qwen_generate",
      { learnerId: input.learnerId, subject: input.subject, pattern },
      { statement: draft.statement, model: explanation.model },
    );
  } else if (explanation.generatedBy === "deterministic_fallback") {
    await logTool(
      "open_weights_qwen_fallback",
      { learnerId: input.learnerId, subject: input.subject, pattern, model: explanation.model },
      { statement: draft.statement, reason: explanation.fallbackReason },
    );
  }

  await saveDraft(draft);
  await logTool("draft_profile_update", input, output);
  return output;
}

export async function commitProfileTool(input: {
  draftId: string;
  teacherName: string;
  decision: "approved" | "modified" | "rejected";
  modifiedStatement?: string;
}) {
  const draft = await getDraft(input.draftId);
  if (!draft) throw new Error("Draft not found.");
  if (!input.teacherName.trim()) throw new Error("Named teacher approval is required.");

  if (input.decision === "rejected") {
    const output = { committed: false, status: "rejected", draftId: draft.id };
    await logTool("commit_profile_update", input, output, input.teacherName, "rejected");
    return output;
  }

  const finalStatement = input.decision === "modified" ? input.modifiedStatement?.trim() : draft.statement;
  if (!finalStatement) throw new Error("A modified statement is required for a modified approval.");
  assertNoRankingOrTrack(finalStatement);

  await commitDraft(draft, input.teacherName, input.decision, finalStatement);
  const output = {
    committed: true,
    status: input.decision,
    draftId: draft.id,
    learnerId: draft.learnerId,
    finalStatement,
  };
  await logTool("commit_profile_update", input, output, input.teacherName, input.decision);
  return output;
}
