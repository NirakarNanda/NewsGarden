"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/lib/useLive";
import { mockActivity, DEMO_FEED } from "@/features/mock";
import type { ActivityItem } from "@/types/events";
import { fetchActivity } from "./activityApi";

export function useActivity() {
  const [fallback] = useState(mockActivity);
  const { data, source } = useLive(fetchActivity, fallback, 3000);
  const [extra, setExtra] = useState<ActivityItem[]>([]);

  // Demo only: keep the feed moving while the backend has no /api/activity.
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
