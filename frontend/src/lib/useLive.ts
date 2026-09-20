"use client";

import { useEffect, useState } from "react";
import { USE_MOCK } from "@/lib/api";

/**
 * Polls the backend. Until the endpoint exists (or when it fails) the
 * fallback demo data stays on screen, and `source` tells you which is which.
 * Swap the interval for socket events once the backend emits them.
 */
export function useLive<T>(fetcher: () => Promise<T>, fallback: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(fallback);
  const [source, setSource] = useState<"mock" | "api">("mock");

  useEffect(() => {
    if (USE_MOCK) return;
    let alive = true;
    const tick = async () => {
      try {
        const next = await fetcher();
        if (alive) {
          setData(next);
          setSource("api");
        }
      } catch {
        /* keep last good data */
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
