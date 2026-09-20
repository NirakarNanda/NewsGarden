"use client";

import { useLive } from "@/lib/useLive";
import { MOCK_AGENTS } from "@/features/mock";
import { fetchAgents } from "./agentApi";

export const useAgents = () => useLive(fetchAgents, MOCK_AGENTS, 3000);
