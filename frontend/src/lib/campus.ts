import type { AgentInfo, AgentLocation } from "@/types/agent";

const WORKING: Partial<Record<AgentLocation, string>> = {
  newsroom: "Researching...",
  "research-lab": "Researching...",
  "editorial-room": "Writing...",
  "visual-studio": "Generating image...",
  "design-studio": "Designing...",
  "quality-room": "Fact checking...",
};

const IDLE: Partial<Record<AgentLocation, string>> = {
  cafe: "Coffee break!",
  "manga-library": "Reading...",
  "badminton-court": "Playing...",
};

/** Speech-bubble text for an agent's real backend state. */
export function bubbleFor(a: AgentInfo): string {
  switch (a.status) {
    case "working": return WORKING[a.location] ?? "Working...";
    case "idle": return IDLE[a.location] ?? "Idle...";
    case "walking": return "On my way...";
    case "waiting": return "Waiting...";
    case "completed": return "Done!";
    case "error": return "Something broke!";
  }
}

/** Busy agents win the room's single bubble. */
export function pickAgent(agents: AgentInfo[], locations: AgentLocation[]) {
  const here = agents.filter((a) => locations.includes(a.location));
  return here.find((a) => a.status === "working" || a.status === "error") ?? here[0];
}
