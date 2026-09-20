import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import Plant from "../objects/Plant";

/** Design department: pages are laid out here. */
export default function DesignStudio({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "design" || a.location === "design-studio");
  return (
    <ZoneShell name="Design Studio" bounds={ZONE_BOUNDS["design-studio"]} agents={here}>
      <Desk x={990} y={230} />
      <Plant x={1180} y={140} />
    </ZoneShell>
  );
}
