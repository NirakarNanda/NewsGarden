import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import NoticeBoard from "../objects/NoticeBoard";

/** Quality department: fact-checking happens here. */
export default function QualityRoom({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "quality" || a.location === "quality-room");
  return (
    <ZoneShell name="Quality" bounds={ZONE_BOUNDS["quality-room"]} agents={here}>
      <Desk x={210} y={480} />
      <NoticeBoard x={330} y={410} scale={0.9} />
    </ZoneShell>
  );
}
