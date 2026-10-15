# TengaLongView — Education Track Submission

**Project:** TengaLongView  
**Track:** Education — The Long View  
**Sub-theme:** Longitudinal Strength Tracking  
**Creator:** Stephen Daniel Kurah  
**Public code:** https://github.com/bakomamman-tech/tengalongview  
**Demo video:** Add the public YouTube/Vimeo URL after a genuine unedited recording is uploaded.

## Project description (approximately 300 words)

TengaLongView is an agentic AI prototype for primary schools in Africa where learner progress is scattered across terms, handwritten notes, and successive teachers. It helps a teacher identify evidence-backed changes in a learner's performance early enough to discuss support with the learner and family. The chosen challenge sub-theme is Longitudinal Strength Tracking.

Instead of judging a child by one examination, the agent retrieves assessment records spanning terms and years, checks their provenance, analyses trends, and drafts a cautious learner-profile update. Every claimed pattern carries explicit evidence IDs. The example dataset is entirely synthetic and includes declining, improving, mixed, incomplete, late-recorded, and missing-source cases.

LangGraph coordinates the workflow. A custom Model Context Protocol (MCP) server exposes four tools: retrieve learner history, analyse longitudinal patterns, draft a profile update, and commit an approved update. A separately maintained Filesystem MCP server reads imported records through a constrained directory, avoiding a custom filesystem implementation. PostgreSQL holds evidence, pending drafts, decisions, and tool audit logs.

The prototype also supports local Qwen2.5 1.5B through Ollama for teacher-facing language generation. Deterministic analysis retains control of the facts and citations; unsupported or unsafe model wording is rejected or replaced with a safe fallback. No external paid model API is required for the demonstrated workflow.

A named teacher must approve, modify, or reject each proposed update. A rejection cannot change the learner's persisted profile. The agent does not diagnose, rank learners, assign academic tracks, or autonomously suggest careers.

The public repository provides a one-command Docker Compose demonstration, architecture documentation, automated tests, and fifteen documented evaluation cases. These include successful handling of insufficient evidence and refusal of unauthorized or unsourced updates. A known unresolved limitation is ingestion of scanned or handwritten records: OCR is not yet implemented. TengaLongView is a synthetic research prototype, not a production student-record system.

## Links to paste into submission form

Repository: https://github.com/bakomamman-tech/tengalongview

Education challenge: https://agentic-africa-challenge.lovable.app/tracks/education

Demo video: TO BE ADDED AFTER UPLOAD.

## Claims and boundaries

- Published evaluations in EVALS.md describe previous local runtime results; today's connected audit did **not** re-run the Docker suite.
- The app is a synthetic-data prototype. It does not make diagnoses or automatically commit learner profiles.
- The unedited public video must show a **real** execution, not slides, animations, or reenactment.
