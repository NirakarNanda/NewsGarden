"use client";

import { useEffect, useRef } from "react";
import { USE_MOCK, apiGet, str, unwrapList } from "@/lib/api";
import { reportChannel } from "@/lib/connection";

/**
 * Realtime news events, polling edition.
 *
 * socket.io-client is not a dependency, so this module polls
 * GET /api/activity every 5s and diffs rows by eventId, exposing the
 * same subscription surface the rest of the UI codes against:
 *
 *   onNewsEvent(cb) -> unsubscribe
 *   useNewsEvents(cb)
 *
 * Backend event types (from the brief): AGENT_STARTED,
 * AGENT_TASK_COMPLETED, AGENT_TASK_FAILED, AGENT_MOVEMENT_REQUESTED,
 * AGENT_IDLE, TASK_CREATED, TASK_STARTED, ARTICLE_DISCOVERED,
 * EDITION_STAGE_COMPLETED, EDITION_READY_FOR_APPROVAL, EDITION_APPROVED,
 * EDITION_PUBLISHED, EDITION_REVISION_REQUESTED.
 *
 * Rows are expected to carry a `type` (falling back to `kind`/`event`);
 * rows without one are ignored. In USE_MOCK mode nothing polls.
 */

export interface NewsEvent {
  /** Stable id used for diffing (backend `eventId`). */
  id: string;
  /** e.g. "AGENT_STARTED". */
  type: string;
  agentId?: string;
  /** Backend-declared destination, e.g. on AGENT_MOVEMENT_REQUESTED. */
  location?: string;
  message?: string;
  /** ISO timestamp. */
  at?: string;
}

type Listener = (event: NewsEvent) => void;

const POLL_MS = 5000;
const MAX_SEEN = 500;

const listeners = new Set<Listener>();
const seen = new Set<string>();
let timer: ReturnType<typeof setInterval> | null = null;
let primed = false;
let inFlight = false;

function toEvent(r: Record<string, unknown>): NewsEvent | null {
  const id = str(r.eventId ?? r.id);
  const type = str(r.type ?? r.kind ?? r.event);
  if (!id || !type) return null;
  const agentId = str(r.agentId);
  const location = str(r.location ?? r.to);
  const message = str(r.message);
  const at = str(r.createdAt ?? r.at);
  return {
    id,
    type,
    ...(agentId ? { agentId } : {}),
    ...(location ? { location } : {}),
    ...(message ? { message } : {}),
    ...(at ? { at } : {}),
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

async function poll() {
  if (inFlight || typeof window === "undefined") return;
  inFlight = true;
  try {
    const rows = unwrapList(await apiGet<unknown>("/api/activity"), "activity");
    for (const r of rows) {
      const id = str(r.eventId ?? r.id);
      if (!id || seen.has(id)) continue;
      remember(id);
      if (!primed) continue; // first pass only warms the seen-set
      const event = toEvent(r);
      if (!event) continue;
      listeners.forEach((l) => {
        try {
          l(event);
        } catch {
          /* one bad listener must not break the bus */
        }
      });
    }
    primed = true;
    reportChannel("events", true);
  } catch {
    // Backend down or endpoint missing: the global connection pill flips
    // to OFFLINE/DEGRADED and lib/api already warned once in dev.
    reportChannel("events", false);
  } finally {
    inFlight = false;
  }
}

function ensurePolling() {
  if (timer !== null || USE_MOCK || typeof window === "undefined") return;
  void poll();
  timer = setInterval(poll, POLL_MS);
}

function maybeStop() {
  if (timer !== null && listeners.size === 0) {
    clearInterval(timer);
    timer = null;
  }
}

/** Subscribe to news events. Returns an unsubscribe function. */
export function onNewsEvent(cb: Listener): () => void {
  listeners.add(cb);
  ensurePolling();
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
