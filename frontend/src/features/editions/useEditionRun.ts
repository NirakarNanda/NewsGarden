"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, USE_MOCK, apiGet, apiPost } from "@/lib/api";
import { authHeaders, loadApprovalKey } from "@/lib/approvalKey";

/**
 * On-demand edition runs (POST /api/editions/run).
 *
 * - `runState` polls GET /api/editions/run every 15s (open endpoint,
 *   no key needed) so the UI can disable the button while a run is
 *   active. Skipped entirely in demo mode.
 * - `startRun()` POSTs with the stored approval key (if any).
 *   Resolves to "started" (202), "running" (409), "needs-key" (401),
 *   or "error".
 */

export interface EditionRunState {
  running: boolean;
  status: "idle" | "running" | "succeeded" | "failed";
  startedAt?: string;
  finishedAt?: string;
  editionId?: string;
  error?: string;
}

export type StartRunResult = "started" | "running" | "needs-key" | "error";

const POLL_MS = 15_000;

const IDLE: EditionRunState = { running: false, status: "idle" };

async function fetchRunState(): Promise<EditionRunState> {
  const raw = await apiGet<{ success: boolean; data: EditionRunState }>(
    "/api/editions/run"
  );
  return raw.data ?? IDLE;
}

export function useEditionRun() {
  const [runState, setRunState] = useState<EditionRunState>(IDLE);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (USE_MOCK) return;
    let alive = true;
    const tick = async () => {
      try {
        const next = await fetchRunState();
        if (alive) setRunState(next);
      } catch {
        // Unreachable backend: leave the last state; the global
        // connection pill already signals the outage.
      }
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      setRunState(await fetchRunState());
    } catch {
      /* keep last state */
    }
  }, []);

  const startRun = useCallback(async (): Promise<StartRunResult> => {
    setStarting(true);
    try {
      await apiPost("/api/editions/run", undefined, {
        headers: authHeaders(loadApprovalKey()),
      });
      await refresh();
      return "started";
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await refresh();
        return "running";
      }
      if (e instanceof ApiError && e.status === 401) return "needs-key";
      return "error";
    } finally {
      setStarting(false);
    }
  }, [refresh]);

  return { runState, starting, startRun, refresh };
}
