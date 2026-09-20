import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Desk from "../objects/Desk";
import NewspaperStack from "../objects/NewspaperStack";
import NoticeBoard from "../objects/NoticeBoard";

/** Discovery department: where stories are found. */
export default function Newsroom({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.department === "discovery" || a.location === "newsroom");
  return (
    <ZoneShell name="Newsroom" bounds={ZONE_BOUNDS["newsroom"]} agents={here}>
      <Desk x={200} y={230} />
      <NewspaperStack x={370} y={270} />
      <NoticeBoard x={420} y={130} />
    </ZoneShell>
  );
}
