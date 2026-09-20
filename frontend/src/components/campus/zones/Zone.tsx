import type { ReactNode } from "react";
import type { AgentInfo } from "@/types/agent";
import type { ZoneBounds } from "./zone";
import AgentNameTag from "../agents/AgentNameTag";
import AgentStatus from "../agents/AgentStatus";

/**
 * Shared frame for every campus zone: an absolutely-positioned section
 * (1536x1024 stage pixels, like CampusMap) with a title, the agents
 * currently there, and the zone's decorative objects.
 */
export default function ZoneShell({
  name,
  bounds,
  agents,
  children,
}: {
  name: string;
  bounds: ZoneBounds;
  agents: AgentInfo[];
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={name}
      style={{
        position: "absolute",
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        pointerEvents: "none",
      }}
    >
      <div className="absolute left-0 top-0 flex items-center gap-2">
        <span
          className="rounded-md border border-white/10 bg-[#0b0f1a]/85 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e6e9ff] backdrop-blur-sm"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {name}
        </span>
        {agents.length > 0 && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-[#b8c0dc]">
            {agents.length}
          </span>
        )}
      </div>
      {agents.length > 0 && (
        <ul className="absolute left-0 top-9 space-y-1.5">
          {agents.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5">
              <AgentNameTag name={a.name} sub={a.role} />
              <AgentStatus status={a.status} />
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}
