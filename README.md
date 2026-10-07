# TengaLongView

**See the pattern before the learner falls behind.**

TengaLongView is an MCP-powered agentic AI prototype for the African Agentic AI Design Challenge — Education track, **The Long View**. It follows one synthetic learner across terms and years, retrieves supporting records through MCP tools, detects sustained patterns, drafts a sourced profile update, and **stops for a named teacher to approve, modify, or reject** before any persistent profile change is made.

> Safety boundary: the system builds a sourced learner profile. It does not diagnose, rank learners against classmates, assign tracks, or make autonomous career/subject-path decisions.

## Current milestone

This repository contains:

- a custom Learner Profile MCP server with four tools, using the MCP TypeScript SDK v2;
- the official community Filesystem MCP server as our borrowed MCP integration for controlled imported-record access;
- a LangGraph workflow that plans, calls tools, handles recoverable evidence gaps, and pauses at a human gate;
- PostgreSQL-backed learner evidence, drafts, approvals, and MCP audit logs;
- synthetic, intentionally imperfect learner records;
- an optional open-weights Qwen2.5 1.5B task through Ollama;
- a minimal teacher demo UI;
- tests and runtime evaluations for longitudinal pattern detection and safety rules.

## Deterministic one-command run

```bash
docker compose up --build
```

Then open `http://localhost:3000`.

The default demo keeps `USE_OPEN_WEIGHTS_LLM=false` so a reviewer can run the core MCP/LangGraph workflow without first downloading a model.

## Open-weights Qwen run

TengaLongView includes a Compose overlay that runs Ollama locally and switches profile-statement wording to `qwen2.5:1.5b`.

Start Ollama:

```bash
docker compose -f docker-compose.yml -f docker-compose.qwen.yml up -d ollama
```

Pull the model once:

```bash
docker compose -f docker-compose.yml -f docker-compose.qwen.yml exec ollama ollama pull qwen2.5:1.5b
```

Then run the full stack with the open-weights model enabled:

```bash
docker compose -f docker-compose.yml -f docker-compose.qwen.yml up --build
```

A successful drafted profile includes `generatedBy: "open_weights"` and `model: "qwen2.5:1.5b"`. The Qwen generation is also written to the PostgreSQL audit log as `open_weights_qwen_generate`.

## Cost per run

In the tested local Docker setup, the **external model/API cost is $0.00 per learner-profile run**.

- The deterministic workflow uses no paid external model API.
- The open-weights workflow runs `qwen2.5:1.5b` locally through Ollama, so it also incurs no per-token external API charge.
- Host hardware, electricity and infrastructure costs are not monetised in this prototype and should not be interpreted as zero operational cost.
- A warmed STU-001 Mathematics open-weights agent run was measured at approximately 3.36 seconds in the development environment; this is a runtime observation, not a production SLA.

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
