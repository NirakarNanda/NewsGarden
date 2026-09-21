"use client";

import { useEffect, useState } from "react";
import { USE_MOCK } from "@/lib/api";
import { reportChannel } from "@/lib/connection";

/**
 * Where the on-screen data came from:
 * - "mock"  — NEXT_PUBLIC_USE_MOCK=true; `data` is demo content.
 * - "api"   — the last poll succeeded; `data` is real.
 * - "error" — the backend is unreachable; `data` is the empty fallback,
 *             so components render a real empty/error state instead of
 *             pretending demo data is live.
 *
 * Every tick reports to the global connection store (see lib/connection),
 * and lib/api logs a dev-only warning once per failing endpoint.
 */
export type LiveSource = "mock" | "api" | "error";

export interface LiveResult<T> {
  data: T;
  source: LiveSource;
}

export function useLive<T>(
  channel: string,
  fetcher: () => Promise<T>,
  fallback: T,
  intervalMs = 5000
): LiveResult<T> {
  const [data, setData] = useState<T>(fallback);
  // Optimistic "api" until the first tick resolves (it runs immediately on
  // mount). `data` still starts as the empty fallback, so nothing fake is
  // ever painted as live.
  const [source, setSource] = useState<LiveSource>(USE_MOCK ? "mock" : "api");

  useEffect(() => {
    if (USE_MOCK) return;
    let alive = true;
    const tick = async () => {
      try {
        const next = await fetcher();
        if (!alive) return;
        setData(next);
        setSource("api");
        reportChannel(channel, true);
      } catch {
        if (!alive) return;
        setData(fallback);
        setSource("error");
        reportChannel(channel, false);
      }
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, source };
}
