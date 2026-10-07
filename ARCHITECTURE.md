# TengaLongView Architecture

## Purpose

TengaLongView is an MCP-powered agent for **Longitudinal Strength Tracking**. It follows one synthetic learner across terms and years, surfaces defensible patterns from sourced evidence, drafts a profile update, and stops for a named teacher before anything consequential is committed.

**Safety boundary:** the system does not diagnose, rank learners, assign tracks, or autonomously recommend career or subject pathways.

## Agent shape

**LangGraph** orchestrates the workflow:

```text
Teacher
  |
  v
Teacher UI
  |
  v
LangGraph
  |
  +--> Borrowed Filesystem MCP
  |      read_text_file
  |
  +--> Custom Learner Profile MCP
  |      get_learner_history
  |      analyse_longitudinal_pattern
  |      draft_profile_update
  |
  +--> Deterministic longitudinal analysis
  |      pattern + evidence IDs
  |
  +--> Optional Qwen2.5 1.5B via Ollama
  |      constrained teacher-facing wording only
  |      deterministic fallback if unsafe/unavailable
  |
  v
HUMAN GATE
  |
  +--> Reject -> audit only
  |
  +--> Approve / Modify
          |
          v
   commit_profile_update
          |
          v
      PostgreSQL
```

## MCP servers

### Custom: TengaLongView Learner Profile MCP

Built with the MCP TypeScript SDK and exposes four reusable tools:

1. `get_learner_history` — retrieves longitudinal evidence.
2. `analyse_longitudinal_pattern` — computes a sourced cross-term pattern.
3. `draft_profile_update` — creates a pending teacher-review draft.
4. `commit_profile_update` — consequential write; requires a named teacher decision.

### Borrowed: Filesystem MCP

TengaLongView uses the official `@modelcontextprotocol/server-filesystem` server for sandboxed imported-record access rather than reimplementing generic file/path controls.

## Model boundary

Deterministic code is the source of truth for the learner pattern and evidence IDs.

When enabled, local **Qwen2.5 1.5B** performs one constrained task: rewriting the deterministic statement into cautious teacher-facing language. Model output is validated. Unsafe, unsupported, or unavailable model output falls back to the deterministic sourced statement.

## Human gate and audit trail

`commit_profile_update` is the write boundary. Approval or modification requires a named teacher; rejection produces no learner-profile update.

PostgreSQL stores learners, evidence, drafts, committed updates and audit logs. MCP actions record tool name, input, output and timestamp. Consequential decisions additionally record the named approver and decision.

## Failure behavior

Missing source files are logged and recover safely. Fewer than three scored observations produce `insufficient_evidence`. Unknown learners or evidence IDs are rejected. Ranking or prescriptive pathway text is blocked before persistence. OCR for handwritten/scanned records is intentionally not implemented in this milestone.
