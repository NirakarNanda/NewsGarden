# NewsGarden V1 Architecture

## System

```
Browser / Next.js frontend
    │  same-origin /api proxy (no CORS in the browser)
    ▼
Express backend ──► Server-Sent Events (/api/events) ──► campus UI
    │                    (replay via ?since=, 20s heartbeats)
    ▼
Brain Agent + Workflow Engine (DailyEditionWorkflow)
    ▼
Specialized agents (discovery, research, editorial, visual, design, quality)
    ▼
Tools (RSS/web fetch, AI via AIService, image placeholders, notifications)
    ▼
MongoDB (articles, editions, approvals, agent state, activity events)
```

`@newsgarden/shared` holds the edition contract (stages, statuses, event
shapes) imported by both backend and frontend, so the campus can never drift
from what the backend emits.

## UI principle

The 2D campus is the visual experience. Real backend agent events drive
character state and GSAP movement. Realtime arrives over SSE; if the stream
drops, the UI falls back to 30s `/api/activity` polling and says so.

Example:

```
AGENT_STARTED
→ AgentMovementRequested
→ character walks to department
→ working animation

AGENT_TASK_COMPLETED
→ character leaves workstation
→ idle behavior: Cafe / Manga Library / Badminton Court
```

## Product rules

- No chat interface in V1.
- No automatic publication. `POST /api/approval/:editionId/publish`
  returns **403** unless a human-approved `Approval` record exists; the check
  lives in the service layer, not just the route.
- The campus reflects real agent state; mock data appears only in explicit,
  visibly labelled demo mode (`NEXT_PUBLIC_USE_MOCK=true`).
- V1 excludes politics, elections, war, deaths, disasters and markets.

## Runtime notes

- One edition run at a time: `POST /api/editions/run` returns `409
RUN_IN_PROGRESS` while a run is active (manual, scheduled and
  `RUN_ON_START` share the same coordinator).
- AI calls go through a process-wide semaphore (`AI_MAX_CONCURRENCY`,
  default 4) so a run can't flood the provider.
- Editions built while the AI is unreachable carry `aiFallback: true` and
  are labelled “Built without AI” in the UI.
- Activity events expire after `ACTIVITY_EVENT_TTL_DAYS` (default 30).
