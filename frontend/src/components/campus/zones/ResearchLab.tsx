import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Bookshelf from "../objects/Bookshelf";
import Desk from "../objects/Desk";

/** Research department: sources are verified here. */
export default function ResearchLab({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "research" || a.location === "research-lab");
  return (
    <ZoneShell name="Research Lab" bounds={ZONE_BOUNDS["research-lab"]} agents={here}>
      <Bookshelf x={450} y={370} scale={0.85} />
      <Desk x={560} y={450} scale={0.9} />
    </ZoneShell>
  );
}
