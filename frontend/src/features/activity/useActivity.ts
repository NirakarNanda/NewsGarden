"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/lib/useLive";
import { USE_MOCK } from "@/lib/api";
import { mockActivity, DEMO_FEED } from "@/features/mock";
import type { ActivityItem } from "@/types/events";
import { fetchActivity } from "./activityApi";

export function useActivity() {
  const [fallback] = useState<ActivityItem[]>(() => (USE_MOCK ? mockActivity() : []));
  // The feed refreshes on every realtime event (throttled inside
  // useLive), with a 30s safety poll.
  const { data, source } = useLive("activity", fetchActivity, fallback, {
    refreshOnEvent: () => true,
  });
  const [extra, setExtra] = useState<ActivityItem[]>([]);

  // Demo only: keep the feed moving in NEXT_PUBLIC_USE_MOCK mode, where the
  // panel is explicitly labelled "Demo data".
  useEffect(() => {
    if (source !== "mock") {
      setExtra([]);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      const [agentId, message] = DEMO_FEED[i++ % DEMO_FEED.length];
      setExtra((e) => [{ id: `demo-${Date.now()}`, agentId, message, at: new Date().toISOString() }, ...e].slice(0, 6));
    }, 8000);
    return () => clearInterval(id);
  }, [source]);

  return { data: source === "mock" ? [...extra, ...data] : data, source };
}
