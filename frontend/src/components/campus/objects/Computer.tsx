"use client";

import type { AgentLocation } from "@/types/agent";

// The monitor glow pass is stubbed out (renders nothing). `working` stays in
// the signature so <Monitors working={...}/> in CampusMap still typechecks.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Monitors(_props: { working: Set<AgentLocation> }) {
  return null;
}
