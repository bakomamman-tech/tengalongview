# TengaLongView Ubuntu Runbook

## 1. Create the public GitHub repository

From the project root, if GitHub CLI is installed and authenticated:

```bash
gh auth status
git init -b main
git add .
git commit -m "feat: bootstrap TengaLongView MCP learner-profile agent"
gh repo create bakomamman-tech/tengalongview --public --source=. --remote=origin --push --description "MCP-powered longitudinal learner profile agent for African schools"
```

If `gh` is not installed, create a blank public repository named `tengalongview` under `bakomamman-tech` in GitHub, then run:

```bash
git init -b main
git add .
git commit -m "feat: bootstrap TengaLongView MCP learner-profile agent"
git remote add origin https://github.com/bakomamman-tech/tengalongview.git
git push -u origin main
```

Do not add a GitHub-generated README, `.gitignore`, or licence when creating the blank repository because those files already exist here.

## 2. Static project check

```bash
node scripts-check.mjs
```

Expected shape:

```text
Static checks passed: 3 synthetic learners, 15 evidence records, 15 unique evidence IDs.
```

## 3. Run with Docker Compose

```bash
docker compose up --build
```

When the app is running, open:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

## 4. First agent run

Use:

```text
Learner: STU-001
Subject: Mathematics
```

Expected workflow:

1. Plan the task.
2. Read the synthetic imported school note through the borrowed Filesystem MCP server.
3. Retrieve structured history through the custom Learner Profile MCP server.
4. Analyse the longitudinal Mathematics pattern.
5. Draft a sourced profile update.
6. Pause at the human gate.
7. Commit only after a named teacher approves or modifies the draft.

## 5. Open-weights Qwen run

After the deterministic MCP workflow works, install/run Ollama on the Ubuntu host, pull the configured Qwen model, and set:

```env
USE_OPEN_WEIGHTS_LLM=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

For a Dockerized app on Linux, host-network access may need an explicit Compose host mapping or a dedicated Ollama service; verify the model endpoint before recording the challenge demo.

## 6. Evidence to capture

Keep terminal output/screenshots showing:

- repository clone/run works;
- custom MCP server starts;
- Filesystem MCP tool call appears;
- custom MCP tool calls appear;
- sourced evidence IDs appear in the pattern/draft;
- the human gate blocks persistence;
- a named teacher approval commits the update;
- rejection does not commit;
- at least one missing-data or insufficient-evidence run;
- the Qwen open-weights task succeeds.
