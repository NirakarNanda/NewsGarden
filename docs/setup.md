# Setup

## Requirements

- Node.js 20
- npm 9+
- MongoDB (local `mongod`, a `mongo:7` container, or MongoDB Atlas)

## Local development

```sh
# from the repo root
npm install

cp backend/.env.example backend/.env
# edit backend/.env — at minimum MONGODB_URI

npm run dev        # backend :4000 + frontend :3000 (works in PowerShell too)
```

Open http://localhost:3000.

Useful `backend/.env` knobs for first run:

- `RUN_ON_START=true` — build an edition immediately at startup instead of
  waiting for the 07:00 `DAILY_EDITION_CRON` schedule.
- `AI_PROVIDER=ollama` (default) — fully local, no key. Needs Ollama running
  with a pulled model (`ollama pull qwen3:4b`).
- `API_KEY=` (empty) — leaves the approval routes open for local dev; set a
  value to require the `x-api-key` header on approve/revise/publish/run.

The campus UI shows the connection state honestly: `live`, `degraded`,
`offline`, or `demo` (when `NEXT_PUBLIC_USE_MOCK=true`).

## Docker

```sh
cp backend/.env.example backend/.env   # once
docker compose up --build
```

Frontend `:3000`, backend `:4000`, MongoDB `:27017`, each with a health check.
For a containerized Ollama: `docker compose --profile ollama up --build`,
then `OLLAMA_BASE_URL=http://ollama:11434` in `backend/.env`.

## Verifying the install

```sh
npm run typecheck   # tsc --noEmit in all workspaces
npm test            # backend 72 + frontend 34 vitest tests
npm run lint        # ESLint in all workspaces
npm run build       # production builds
```

The milestone check from the original plan still holds: an edition run
emits `AGENT_STARTED`/`AGENT_TASK_COMPLETED` events → the backend stores
agent state → the campus characters animate. Watch it live at
`GET /api/events` or on the campus activity timeline.
