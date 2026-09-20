import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import NoticeBoard from "../objects/NoticeBoard";
import Plant from "../objects/Plant";

/** Leisure zone: agents play here when idle. */
export default function BadmintonCourt({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.location === "badminton-court");
  return (
    <ZoneShell name="Badminton Court" bounds={ZONE_BOUNDS["badminton-court"]} agents={here}>
      <Plant x={870} y={670} />
      <NoticeBoard x={1100} y={660} scale={0.85} />
    </ZoneShell>
  );
}
