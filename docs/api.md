# NewsGarden API

Base URL `/api`. The frontend proxies it same-origin, so browsers never make
cross-origin calls; direct access is on the backend port (`:4000`).

Errors are structured JSON:

```json
{
  "success": false,
  "error": "Edition not found",
  "code": "NOT_FOUND",
  "path": "/api/editions/abc",
  "requestId": "..."
}
```

## Health & index

| Method | Path          | Notes                                                       |
| ------ | ------------- | ----------------------------------------------------------- |
| GET    | `/`           | Service index: name, version, links                         |
| GET    | `/api/health` | `status`, `uptime`, `ai` (`provider`, `reachable`, `model`) |

## Realtime

| Method | Path            | Notes                                                                                                                                                            |
| ------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/events`   | **Server-Sent Events** stream of agent/activity events. `?since=<eventId>` (or `Last-Event-ID`) replays missed events; 20s heartbeats keep the connection alive. |
| GET    | `/api/activity` | Paginated recent activity events (also the 30s fallback when SSE is down).                                                                                       |

The campus UI consumes SSE first and falls back to polling only if the stream
drops. There is no WebSocket and no chat endpoint.

## Agents

| Method | Path                       | Notes                                       |
| ------ | -------------------------- | ------------------------------------------- |
| GET    | `/api/agents`              | Current agent states                        |
| GET    | `/api/agents/:agentId`     | One agent's state                           |
| POST   | `/api/agents/:agentId/run` | Dispatch an on-demand task (body validated) |

## Articles & editions

| Method | Path                       | Notes                                                                                                                                                                            |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/articles`            | Paginated (`limit`, `offset` validated)                                                                                                                                          |
| GET    | `/api/articles/:articleId` | One article                                                                                                                                                                      |
| GET    | `/api/editions`            | Paginated editions                                                                                                                                                               |
| GET    | `/api/editions/:editionId` | One edition; includes `aiFallback: true` when built without AI                                                                                                                   |
| GET    | `/api/editions/run`        | Current/last edition-run state                                                                                                                                                   |
| POST   | `/api/editions/run`        | Start an edition build. `202` accepted, `409 RUN_IN_PROGRESS` if one is already running. Requires the API key when `API_KEY` is set. Stricter rate limit (a build is expensive). |

## Approval (human gate)

Mutating routes require a matching `x-api-key` header when `API_KEY` is set.
Read-only routes are always open.

| Method | Path                               | Notes                                                                                                                        |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/approval/pending`            | Editions waiting for a human decision                                                                                        |
| POST   | `/api/approval/:editionId/approve` | Approve. Body: `{ note?, decidedBy? }` (validated)                                                                           |
| POST   | `/api/approval/:editionId/revise`  | Send back for revision with a note                                                                                           |
| POST   | `/api/approval/:editionId/publish` | Publish. **403 unless an approved `Approval` record exists** — enforced in the service layer even for authenticated callers. |

There is no endpoint that publishes without approval.

## Limits

- `/api` is rate-limited: 300 requests / 15 min per IP; approval mutations and
  `POST /api/editions/run` allow 60 / 15 min.
- Query/body payloads are validated (Zod); invalid input returns `400 BAD_REQUEST`.
- `GET /api/events` is excluded from response compression so SSE frames flush immediately.
