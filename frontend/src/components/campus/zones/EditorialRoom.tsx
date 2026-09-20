import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import NewspaperStack from "../objects/NewspaperStack";

/** Editorial department: articles are written here. */
export default function EditorialRoom({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "editorial" || a.location === "editorial-room");
  return (
    <ZoneShell name="Editorial" bounds={ZONE_BOUNDS["editorial-room"]} agents={here}>
      <Desk x={660} y={230} />
      <NewspaperStack x={800} y={270} />
    </ZoneShell>
  );
}
