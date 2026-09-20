"use client";

import { useNewsEvents } from "@/lib/socket";
import type { AgentInfo, AgentLocation } from "@/types/agent";

/** Where agents unwind when a task ends. */
const LEISURE: AgentLocation[] = ["cafe", "manga-library", "badminton-court"];

/**
 * Logic-only component: when the backend emits AGENT_IDLE for this agent,
 * pick a leisure spot (Cafe / Manga Library / Badminton Court) and hand it
 * to the parent, which moves the sprite (see AgentMovement).
 */
export default function AgentBehavior({
  agent,
  onRelocate,
}: {
  agent: AgentInfo;
  onRelocate: (location: AgentLocation) => void;
}) {
  useNewsEvents((e) => {
    if (e.type !== "AGENT_IDLE" || e.agentId !== agent.id) return;
    onRelocate(LEISURE[Math.floor(Math.random() * LEISURE.length)]);
  });
  return null;
}
