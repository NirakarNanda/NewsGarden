# NewsGarden

An AI newsroom that writes a daily newspaper. A crew of specialized agents —
discovery, research, editorial, visual, design, quality — builds each edition,
and a 2D campus UI visualizes their **real** state as they work. There is no
chat interface, and **nothing publishes without a human's approval**.

```
Browser ──► Next.js frontend ──► Express backend ──► Agent crew ──► MongoDB
                 │                       │
                 │  /api proxy           │  SSE /api/events (realtime)
                 │  (same-origin)        │  REST /api/* (reads + approvals)
```

V1 scope: tech, science and culture news. Politics, elections, war, deaths,
disasters and markets are out of scope.

## Quick start

Prerequisites: **Node.js 20**, **npm**, and **MongoDB** (local or Atlas).

```sh
# 1. Install (npm workspaces: shared, backend, frontend)
npm install

# 2. Configure the backend
cp backend/.env.example backend/.env
# Edit backend/.env: at minimum set MONGODB_URI.
# AI defaults to local Ollama — no key needed (see "AI providers").

# 3. Run everything (backend :4000 + frontend :3000)
npm run dev
```

Open http://localhost:3000. To build an edition immediately instead of waiting
for the 07:00 schedule, either set `RUN_ON_START=true` in `backend/.env` or
press **Run today's edition** on the campus panel (needs the API key if
`API_KEY` is set).

## Scripts (repo root)

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Backend + frontend together (works on PowerShell too) |
| `npm run build`     | Production builds: shared → backend → frontend        |
| `npm run typecheck` | `tsc --noEmit` in every workspace                     |
| `npm test`          | Vitest suites in backend + frontend                   |
| `npm run lint`      | ESLint in every workspace                             |
| `npm run format`    | Prettier write over the repo                          |

Per-workspace: `npm run <script> --workspace=newsgarden-backend` (or
`newsgarden-frontend`, `@newsgarden/shared`).

## Environment variables

Backend (`backend/.env`, see `backend/.env.example` — never commit real
secrets):

| Variable                                  | Default                                | Purpose                                       |
| ----------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `PORT`                                    | `4000`                                 | Backend listen port                           |
| `MONGODB_URI`                             | `mongodb://localhost:27017/newsgarden` | Database (required)                           |
| `CORS_ORIGINS`                            | localhost dev origins                  | Comma-separated CORS allowlist                |
| `API_KEY`                                 | _(empty = open local dev)_             | When set, approval mutations need `x-api-key` |
| `AI_PROVIDER`                             | `ollama`                               | `ollama` \| `gemini` \| `openai`              |
| `OLLAMA_BASE_URL`                         | `http://localhost:11434`               | Ollama host                                   |
| `OLLAMA_MODEL`                            | `qwen3:4b`                             | Ollama model                                  |
| `GEMINI_API_KEY`                          | _(empty)_                              | Only for `AI_PROVIDER=gemini`                 |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | _(empty)_                              | Only for `AI_PROVIDER=openai`                 |
| `DAILY_EDITION_CRON`                      | `0 7 * * *`                            | Daily edition schedule                        |
| `RUN_ON_START`                            | `false`                                | Build one edition at startup                  |
| `HEARTBEAT_INTERVAL_MS`                   | `15000`                                | Agent liveness interval                       |
| `AI_MAX_CONCURRENCY`                      | `4`                                    | Max parallel AI calls                         |
| `ACTIVITY_EVENT_TTL_DAYS`                 | `30` (`0` = keep forever)              | Activity event retention                      |
| `SMTP_HOST/PORT/USER/PASS/FROM`           | _(empty = console log)_                | Approval notification email (optional)        |

Frontend (`frontend/.env.local`, see `frontend/.env.example`):

| Variable               | Default                 | Purpose                                                    |
| ---------------------- | ----------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:4000` | Direct backend URL (dev fallback; `/api` proxy is default) |
| `NEXT_PUBLIC_USE_MOCK` | `false`                 | `true` = demo mode: built-in fake data, visibly labelled   |

## AI providers (all free-tier friendly)

- **Ollama** (default): fully local, no key. Install Ollama, `ollama pull qwen3:4b`, run.
- **Gemini**: `AI_PROVIDER=gemini` + `GEMINI_API_KEY` (generous free tier).
- **OpenAI-compatible**: `AI_PROVIDER=openai` + `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL`
  — unlocks Groq, OpenRouter (`:free` models), Cerebras, etc.

At startup the backend probes the configured provider; `GET /api/health`
reports `ai.reachable`. If the AI is unreachable, editions are still built
from collected stories and are labelled **“Built without AI”** everywhere —
never silently.

## The human approval gate

Editions flow `draft → in-review → approved | published`. Publishing is a
two-step human action and the backend enforces it:

- `POST /api/approval/:editionId/approve` — approve (API key required when `API_KEY` is set)
- `POST /api/approval/:editionId/revise` — send back with a note
- `POST /api/approval/:editionId/publish` — **returns 403 unless an approved
  `Approval` record exists**, even for authenticated callers

There is no auto-publish path anywhere in the codebase.

## API overview

Base URL `/api` (same-origin through the frontend; direct on `:4000`).

| Method | Path                               | Notes                                                                   |
| ------ | ---------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/`                                | Service index (name, version, links)                                    |
| GET    | `/api/health`                      | Status incl. `ai` provider reachability and model                       |
| GET    | `/api/agents`                      | Agent states                                                            |
| POST   | `/api/agents/:id/run`              | Dispatch an on-demand agent task                                        |
| GET    | `/api/articles` / `:articleId`     | Paginated articles                                                      |
| GET    | `/api/editions` / `:editionId`     | Editions; `aiFallback` flag when built without AI                       |
| GET    | `/api/editions/run`                | Current/last run state                                                  |
| POST   | `/api/editions/run`                | Start an edition build → `202`; `409` if one is running (auth required) |
| GET    | `/api/approval/pending`            | Editions awaiting a human decision                                      |
| POST   | `/api/approval/:editionId/approve` | Approve (key-gated)                                                     |
| POST   | `/api/approval/:editionId/revise`  | Request revision with a note (key-gated)                                |
| POST   | `/api/approval/:editionId/publish` | Publish — **403 without an approved record** (key-gated)                |
| GET    | `/api/activity`                    | Recent activity events (paginated)                                      |
| GET    | `/api/events`                      | **Server-Sent Events** realtime stream (`?since=` replay, heartbeats)   |

Errors are structured JSON: `{ success: false, error, code, path, requestId }`.
`/api` is rate-limited (300 req/15 min; approval mutations and edition runs stricter).

## Demo mode

Set `NEXT_PUBLIC_USE_MOCK=true` to run the frontend with zero backend:
every screen shows built-in sample data behind a visible **DEMO DATA** badge.
Live, degraded and offline connection states are shown honestly otherwise —
the UI never presents mock data as real.

## Docker

```sh
cp backend/.env.example backend/.env   # once
docker compose up --build
```

- Frontend `:3000` → backend `:4000` → MongoDB `:27017`, all with health checks.
- `backend/.env` is optional in compose (`required: false`); without it the
  backend still boots, but set `MONGODB_URI` for real data.
- Ollama is expected on the **host** (`OLLAMA_BASE_URL=http://host.docker.internal:11434`
  on Docker Desktop). Or run it in compose: `docker compose --profile ollama up --build`,
  then `OLLAMA_BASE_URL=http://ollama:11434` and `docker compose exec ollama ollama pull qwen3:4b`.

## Project layout

```
shared/      @newsgarden/shared — edition contract, event + agent types
backend/     Express API, agent engine, workflows, MongoDB models
frontend/    Next.js 15 app: campus UI, newsroom, edition/article readers
docs/        api.md · architecture.md · setup.md
```

## CI

`.github/workflows/ci.yml` runs on push/PR: `npm ci` → typecheck → lint →
tests → production builds. No secrets or `.env` files needed.
