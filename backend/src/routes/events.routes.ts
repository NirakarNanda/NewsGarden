import type { Request, Response } from "express";
import { Router } from "express";

import { eventBus } from "../engine/events/EventBus.js";

import { ActivityEvent } from "../models/ActivityEvent.js";

import { logger } from "../utils/logger.js";

/*
 * GET /api/events — Server-Sent Events stream of newsroom events.
 *
 * - Replay: `?since=<ISO timestamp>` replays persisted events after
 *   that time; otherwise the EventSource `Last-Event-ID` header is
 *   honored (mapped to the event's emittedAt); otherwise the last
 *   50 events are sent.
 * - Heartbeat comment every 20s keeps proxies from closing the
 *   stream and lets clients detect a dead connection.
 * - Frames: `id: <eventId>\ndata: <json>\n\n` where json is
 *   `{ name, agentId, payload, emittedAt }`.
 *
 * Clients are tracked in `sseClients` so shutdown can close them
 * (see server.ts).
 */

const HEARTBEAT_MS = 20000;

const REPLAY_LIMIT = 50;

export const sseClients = new Set<Response>();

interface ReplayRow {
  eventId: string;

  name: string;

  agentId?: string;

  payload?: Record<string, unknown>;

  emittedAt: Date;
}

function frame(
  id: string,
  data: unknown
): string {

  return `id: ${id}\ndata: ${JSON.stringify(data)}\n\n`;
}

function toClientEvent(row: ReplayRow) {

  return {
    name: row.name,
    agentId: row.agentId ?? null,
    payload: row.payload ?? {},
    emittedAt:
      row.emittedAt instanceof Date
        ? row.emittedAt.toISOString()
        : row.emittedAt,
  };
}

async function replaySince(
  since: Date | null,
  res: Response
): Promise<string | null> {

  let lastId: string | null = null;

  try {

    const query =
      since && !Number.isNaN(since.getTime())
        ? { emittedAt: { $gt: since } }
        : {};

    const rows = (await ActivityEvent.find(query)
      .sort({ emittedAt: 1 })
      .limit(REPLAY_LIMIT)
      .lean()) as unknown as ReplayRow[];

    for (const row of rows) {

      lastId = row.eventId;

      if (!res.write(frame(row.eventId, toClientEvent(row)))) {

        break;
      }
    }

  } catch (error) {

    logger.warn(
      "SSE replay failed; starting live-only stream.",
      error instanceof Error ? error.message : error
    );
  }

  return lastId;
}

async function resolveSince(req: Request): Promise<Date | null> {

  const sinceParam =
    typeof req.query.since === "string"
      ? req.query.since
      : null;

  if (sinceParam) {

    const parsed = new Date(sinceParam);

    if (!Number.isNaN(parsed.getTime())) {

      return parsed;
    }
  }

  const lastEventId = req.header("Last-Event-ID");

  if (lastEventId) {

    try {

      const row = (await ActivityEvent.findOne({
        eventId: lastEventId,
      }).lean()) as unknown as ReplayRow | null;

      if (row?.emittedAt) {

        return new Date(row.emittedAt);
      }

    } catch {

      // Fall through to the default replay window.
    }
  }

  return null;
}

const router = Router();

router.get("/", async (req: Request, res: Response) => {

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Flush headers immediately so the client
  // knows the stream is open.
  res.flushHeaders?.();

  sseClients.add(res);

  let counter = 0;

  const sendLive = (name: string, payload: Record<string, unknown>) => {

    counter += 1;

    const id = `live-${Date.now()}-${counter}`;

    res.write(
      frame(id, {
        name,
        agentId: payload.agentId ?? null,
        payload,
        emittedAt: new Date().toISOString(),
      })
    );
  };

  const heartbeat = setInterval(() => {

    res.write(": heartbeat\n\n");

  }, HEARTBEAT_MS);

  const cleanup = () => {

    clearInterval(heartbeat);

    eventBus.offAny(sendLive);

    sseClients.delete(res);

    if (!res.writableEnded) {

      res.end();
    }
  };

  req.on("close", cleanup);

  // Replay first, then go live.
  const since = await resolveSince(req);

  await replaySince(since, res);

  if (req.closed || res.writableEnded) {

    cleanup();

    return;
  }

  eventBus.onAny(sendLive);
});

export default router;
