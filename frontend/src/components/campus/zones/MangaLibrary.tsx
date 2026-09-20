import type { AgentInfo } from "@/types/agent";
import ZoneShell from "./Zone";
import { ZONE_BOUNDS } from "./zone";
import Bookshelf from "../objects/Bookshelf";
import Desk from "../objects/Desk";

/** Leisure zone: agents read here when idle. */
export default function MangaLibrary({ agents }: { agents: AgentInfo[] }) {
  const here = agents.filter((a) => a.location === "manga-library");
  return (
    <ZoneShell name="Manga Library" bounds={ZONE_BOUNDS["manga-library"]} agents={here}>
      <Bookshelf x={990} y={440} scale={0.9} />
      <Desk x={1100} y={520} scale={0.85} />
    </ZoneShell>
  );
}
