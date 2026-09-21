"use client";

import { useEffect, useRef, useState } from "react";
import { USE_MOCK } from "@/lib/api";
import { reportChannel } from "@/lib/connection";
import { onNewsEvent, type NewsEvent } from "@/lib/socket";

/**
 * Where the on-screen data came from:
 * - "mock"  — NEXT_PUBLIC_USE_MOCK=true; `data` is demo content.
 * - "api"   — the last poll succeeded; `data` is real.
 * - "error" — the backend is unreachable; `data` is the empty fallback,
 *             so components render a real empty/error state instead of
 *             pretending demo data is live.
 *
 * Refresh strategy (SSE-first): data refreshes immediately when a
 * matching realtime event arrives (see `refreshOnEvent`), plus a slow
 * safety poll (default 30s) for environments without SSE. Every tick
 * reports to the global connection store (see lib/connection), and
 * lib/api logs a dev-only warning once per failing endpoint.
 */

export type LiveSource = "mock" | "api" | "error";

export interface LiveResult<T> {
  data: T;
  source: LiveSource;
}

export interface UseLiveOptions {
  /** Safety-net poll cadence. Defaults to 30s; SSE events refresh sooner. */
  intervalMs?: number;
  /**
   * When set, a matching realtime event triggers an immediate refetch.
   * Throttled by `eventThrottleMs` so a busy newsroom doesn't stampede.
   */
  refreshOnEvent?: (event: NewsEvent) => boolean;
  /** Minimum ms between event-triggered refetches. Default 2000. */
  eventThrottleMs?: number;
}

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_EVENT_THROTTLE_MS = 2_000;

export function useLive<T>(
  channel: string,
  fetcher: () => Promise<T>,
  fallback: T,
  options: UseLiveOptions = {}
): LiveResult<T> {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    refreshOnEvent,
    eventThrottleMs = DEFAULT_EVENT_THROTTLE_MS,
  } = options;

  const [data, setData] = useState<T>(fallback);
  // Optimistic "api" until the first tick resolves (it runs immediately on
  // mount). `data` still starts as the empty fallback, so nothing fake is
  // ever painted as live.
  const [source, setSource] = useState<LiveSource>(USE_MOCK ? "mock" : "api");

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const lastFetchAt = useRef(0);
  // Serialized snapshot of the last data we committed. Polls that
  // return identical content skip setData, so a no-op tick doesn't
  // re-render every subscriber (the whole campus scene).
  const lastSerialized = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (USE_MOCK) return;
    let alive = true;

    const tick = async () => {
      lastFetchAt.current = Date.now();
      try {
        const next = await fetcherRef.current();
        if (!alive) return;
        const serialized = JSON.stringify(next);
        if (serialized !== lastSerialized.current) {
          lastSerialized.current = serialized;
          setData(next);
        }
        setSource("api");
        reportChannel(channel, true);
      } catch {
        if (!alive) return;
        // Reset the snapshot so the next successful fetch always
        // commits, even if its content matches the pre-error data.
        lastSerialized.current = undefined;
        setData(fallback);
        setSource("error");
        reportChannel(channel, false);
      }
    };

    void tick();
    const id = setInterval(tick, intervalMs);

    const stopEvents = refreshOnEvent
      ? onNewsEvent((event) => {
          if (!refreshOnEvent(event)) return;
          if (Date.now() - lastFetchAt.current < eventThrottleMs) return;
          void tick();
        })
      : undefined;

    return () => {
      alive = false;
      clearInterval(id);
      stopEvents?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, source };
}
