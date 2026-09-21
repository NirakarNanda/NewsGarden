"use client";

import { useLive } from "@/lib/useLive";
import { USE_MOCK } from "@/lib/api";
import { MOCK_AGENTS } from "@/features/mock";
import type { AgentInfo } from "@/types/agent";
import { fetchAgents } from "./agentApi";

/**
 * Live agent list. In demo mode (NEXT_PUBLIC_USE_MOCK=true) this returns the
 * mock roster; otherwise the fallback is empty, so an unreachable backend
 * renders a real empty state instead of fake agents.
 */
export const useAgents = () =>
  useLive<AgentInfo[]>("agents", fetchAgents, USE_MOCK ? MOCK_AGENTS : [], 3000);
