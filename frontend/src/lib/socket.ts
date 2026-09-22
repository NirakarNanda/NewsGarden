"use client";

import { useEffect, useRef } from "react";
import { USE_MOCK, apiGet, str, unwrapList } from "@/lib/api";
import { reportChannel } from "@/lib/connection";

/**
 * Realtime news events, SSE-first edition.
 *
 * Primary channel: GET /api/events as an EventSource (the Next.js
 * dev/prod server rewrites /api/:path* to the backend). Frames look
 * like:
 *
 *   id: <eventId>
 *   data: {"name","agentId","payload","emittedAt"}
 *
 * EventSource reconnects natively (Last-Event-ID resume is handled
 * server-side). While the stream is unhealthy, a 30s poll of
 * GET /api/activity keeps events flowing as a fallback — never the
 * old 5s hot poll.
 *
 * The subscription surface is unchanged:
 *
 *   onNewsEvent(cb) -> unsubscribe
 *   useNewsEvents(cb)
 *
 * Backend event types: AGENT_STARTED, AGENT_TASK_COMPLETED,
 * AGENT_TASK_FAILED, AGENT_MOVEMENT_REQUESTED, AGENT_IDLE,
 * TASK_CREATED, TASK_STARTED, ARTICLE_DISCOVERED,
 * EDITION_STAGE_COMPLETED, EDITION_READY_FOR_APPROVAL,
 * EDITION_APPROVED, EDITION_PUBLISHED, EDITION_REVISION_REQUESTED.
 *
 * In USE_MOCK mode nothing connects.
 */

export interface NewsEvent {
  /** Stable id (SSE `id:` field, or backend `eventId` on the poll path). */
  id: string;
  /** e.g. "AGENT_STARTED". */
  type: string;
  agentId?: string;
  /** Backend-declared destination, e.g. on AGENT_MOVEMENT_REQUESTED. */
  location?: string;
  message?: string;
  /** ISO timestamp. */
  at?: string;
  /** Where this event came from: the SSE stream or the 30s fallback poll. */
  via?: "sse" | "fallback";
  /** Raw backend payload (editionId, articleId, stage, etc.). */
  payload?: Record<string, unknown>;
}

type Listener = (event: NewsEvent) => void;

const FALLBACK_POLL_MS = 30_000;
const MAX_SEEN = 500;

const listeners = new Set<Listener>();
const seen = new Set<string>();
let source: EventSource | null = null;
let streamHealthy = false;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
let fallbackInFlight = false;
let primed = false;

/** Map one SSE frame to a NewsEvent. Exported for tests. */
export function toNewsEvent(id: string, frame: Record<string, unknown>): NewsEvent | null {
  const type = str(frame.name);
  if (!id || !type) return null;
  const payload =
    frame.payload && typeof frame.payload === "object"
      ? (frame.payload as Record<string, unknown>)
      : {};
  const agentId = str(frame.agentId ?? payload.agentId);
  const location = str(payload.toZone ?? payload.location ?? payload.to);
  const message = str(payload.message ?? payload.stage ?? payload.error);
  const at = str(frame.emittedAt ?? payload.at);
  return {
    id,
    type,
    ...(agentId ? { agentId } : {}),
    ...(location ? { location } : {}),
    ...(message ? { message } : {}),
    ...(at ? { at } : {}),
    payload,
  };
}

/** Map one /api/activity row to a NewsEvent (fallback path). Exported for tests. */
export function rowToNewsEvent(r: Record<string, unknown>): NewsEvent | null {
  const id = str(r.eventId ?? r.id);
  const type = str(r.type ?? r.kind ?? r.event ?? r.name);
  if (!id || !type) return null;
  const agentId = str(r.agentId);
  const payload =
    r.payload && typeof r.payload === "object"
      ? (r.payload as Record<string, unknown>)
      : {};
  const location = str(r.location ?? r.to ?? payload.toZone);
  const message = str(r.message ?? payload.message ?? payload.stage);
  const at = str(r.createdAt ?? r.at ?? r.emittedAt);
  return {
    id,
    type,
    ...(agentId ? { agentId } : {}),
    ...(location ? { location } : {}),
    ...(message ? { message } : {}),
    ...(at ? { at } : {}),
    payload,
  };
}

function remember(id: string) {
  seen.add(id);
  if (seen.size > MAX_SEEN) {
    const drop = seen.size - MAX_SEEN;
    let i = 0;
    for (const key of seen) {
      seen.delete(key);
      if (++i >= drop) break;
    }
  }
}

function dispatch(event: NewsEvent) {
  if (seen.has(event.id)) return;
  remember(event.id);
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* one bad listener must not break the bus */
    }
  });
}

function setStreamHealthy(healthy: boolean) {
  if (streamHealthy === healthy) return;
  streamHealthy = healthy;
  reportChannel("events", healthy);
  if (healthy) stopFallbackPoll();
  else startFallbackPoll();
}

async function fallbackPoll() {
  if (fallbackInFlight || typeof window === "undefined") return;
  fallbackInFlight = true;
  try {
    const rows = unwrapList(await apiGet<unknown>("/api/activity"), "activity");
    for (const r of rows) {
      const id = str(r.eventId ?? r.id);
      if (!id || seen.has(id)) continue;
      remember(id);
      if (!primed) continue; // first pass only warms the seen-set
      const event = rowToNewsEvent(r);
      if (event) dispatch({ ...event, via: "fallback" });
    }
    primed = true;
    // The poll answered: the backend is reachable even though the
    // SSE stream is not. Report per-tick so the pill can show
    // DEGRADED instead of OFFLINE.
    reportChannel("events", true);
  } catch {
    reportChannel("events", false);
  } finally {
    fallbackInFlight = false;
  }
}

function startFallbackPoll() {
  if (fallbackTimer !== null || typeof window === "undefined") return;
  void fallbackPoll();
  fallbackTimer = setInterval(fallbackPoll, FALLBACK_POLL_MS);
}

function stopFallbackPoll() {
  if (fallbackTimer !== null) {
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }
}

function ensureStream() {
  if (source !== null || USE_MOCK || typeof window === "undefined") return;
  if (typeof EventSource === "undefined") {
    // No SSE support: straight to the 30s fallback poll.
    reportChannel("events", false);
    startFallbackPoll();
    return;
  }

  const es = new EventSource("/api/events");
  source = es;

  es.onopen = () => {
    setStreamHealthy(true);
  };

  es.onmessage = (m: MessageEvent) => {
    let frame: Record<string, unknown>;
    try {
      frame = JSON.parse(m.data) as Record<string, unknown>;
    } catch {
      return;
    }
    const event = toNewsEvent(
      str((m as MessageEvent & { lastEventId?: string }).lastEventId),
      frame
    );
    if (event) {
      dispatch({ ...event, via: "sse" });
      setStreamHealthy(true);
    }
  };

  es.onerror = () => {
    // EventSource retries natively; meanwhile the 30s poll covers us.
    setStreamHealthy(false);
  };
}

function maybeStop() {
  if (listeners.size === 0) {
    if (source !== null) {
      source.close();
      source = null;
    }
    streamHealthy = false;
    stopFallbackPoll();
  }
}

/** Subscribe to news events. Returns an unsubscribe function. */
export function onNewsEvent(cb: Listener): () => void {
  listeners.add(cb);
  ensureStream();
  return () => {
    listeners.delete(cb);
    maybeStop();
  };
}

/** React hook version of onNewsEvent. The callback is always current. */
export function useNewsEvents(cb: (event: NewsEvent) => void): void {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => onNewsEvent((e) => ref.current(e)), []);
}
