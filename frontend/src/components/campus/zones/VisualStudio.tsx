import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import Plant from "../objects/Plant";

/** Visual department: illustrations and images are made here. */
export default function VisualStudio({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "visual" || a.location === "visual-studio");
  return (
    <ZoneShell name="Visual Studio" bounds={ZONE_BOUNDS["visual-studio"]} agents={here}>
      <Desk x={220} y={700} />
      <Plant x={400} y={650} />
    </ZoneShell>
  );
}
