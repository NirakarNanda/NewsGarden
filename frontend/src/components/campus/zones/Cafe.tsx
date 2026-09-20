import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import NewspaperStack from "../objects/NewspaperStack";
import Plant from "../objects/Plant";

/** Leisure zone: agents unwind here when idle. */
export default function Cafe({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.location === "cafe");
  return (
    <ZoneShell name="Café" bounds={ZONE_BOUNDS["cafe"]} agents={here}>
      <Desk x={600} y={520} scale={0.9} />
      <NewspaperStack x={720} y={560} scale={0.9} />
      <Plant x={790} y={450} />
    </ZoneShell>
  );
}
