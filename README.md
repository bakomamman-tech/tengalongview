# TengaLongView

**See the pattern before the learner falls behind.**

TengaLongView is an MCP-powered agentic AI prototype for the African Agentic AI Design Challenge — Education track, **The Long View**. It follows one synthetic learner across terms and years, retrieves supporting records through MCP tools, detects sustained patterns, drafts a sourced profile update, and **stops for a named teacher to approve, modify, or reject** before any persistent profile change is made.

> Safety boundary: the system builds a sourced learner profile. It does not diagnose, rank learners against classmates, assign tracks, or make autonomous career/subject-path decisions.

## Current milestone

This repository is the first working scaffold. It contains:

- a custom Learner Profile MCP server with four tools, using the MCP TypeScript SDK v2;
- the official community Filesystem MCP server as our borrowed MCP integration for controlled imported-record access;
- a LangGraph workflow that plans, calls tools, handles insufficient evidence, and pauses at a human gate;
- PostgreSQL-backed learner evidence, drafts, approvals, and MCP audit logs;
- synthetic, intentionally imperfect learner records;
- optional open-weights Qwen inference through Ollama;
- a minimal teacher demo UI;
- tests for longitudinal pattern detection and safety rules.

## Run in one command

```bash
docker compose up --build
```

Then open `http://localhost:3000`.

The default Docker demo runs deterministically with `USE_OPEN_WEIGHTS_LLM=false` so a reviewer can run it without first downloading a model. To demonstrate the required open-weights model task, run Ollama locally, pull a compatible Qwen model, and set `USE_OPEN_WEIGHTS_LLM=true` plus `OLLAMA_MODEL` before starting the app.

## MCP servers

### 1. Custom Learner Profile MCP server

1. `get_learner_history` — retrieves one learner's longitudinal evidence.
2. `analyse_longitudinal_pattern` — computes a defensible pattern from sourced assessments.
3. `draft_profile_update` — creates a sourced draft for teacher review.
4. `commit_profile_update` — action tool; refuses to commit without a named teacher decision.

### 2. Borrowed Filesystem MCP server

We use the official `@modelcontextprotocol/server-filesystem` package to read imported school-record files from a sandboxed directory. It beats writing our own filesystem layer because access control, file tooling and MCP interoperability are already implemented and reusable; TengaLongView can stay focused on learner-profile logic.

During an agent run, the workflow calls the borrowed server's `read_text_file` tool for a synthetic source note. Missing files are treated as recoverable evidence gaps and recorded as warnings rather than fabricated.

## Human-in-the-loop

The agent may retrieve, analyse and draft. The write boundary is `commit_profile_update`. A named teacher must approve or modify the draft before it is committed. Rejections are logged but do not update the learner profile.

## Synthetic data only

All learner names and records under `data/synthetic/` are fictional. Do not add real minor data without explicit institutional/guardian consent and an appropriate data-protection process.

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`docs/architecture.png`](docs/architecture.png).

## Evaluation

See [`EVALS.md`](EVALS.md). The evaluation set intentionally includes failure and edge cases rather than only curated passing examples.

## License

MIT.
