"use client";

import { memo, useMemo } from "react";
import { useAgents } from "@/features/agents/useAgents";
import { BUBBLES } from "@/lib/constants";
import { bubbleFor, pickAgent } from "@/lib/campus";
import { SPRITES } from "@/lib/sprites";
import { SPRITE_LOCATIONS } from "@/lib/scenery";
import type { AgentLocation } from "@/types/agent";
import AgentBubble from "@/components/campus/agents/AgentBubble";
import AgentSprite from "@/components/campus/agents/AgentSprite";
import BadmintonRally from "@/components/campus/agents/BadmintonRally";
import Monitors from "@/components/campus/objects/Computer";
import Lamps from "@/components/campus/objects/Lamp";
import Steam from "@/components/campus/objects/CoffeeMachine";
import Twinkle from "@/components/campus/objects/Twinkle";
import AmbientParticles from "@/components/campus/objects/AmbientParticles";
import Emote from "@/components/campus/objects/Emotes";

/**
 * One static scenery image. Memoized: pure function of the module-level
 * SPRITES table, so it never re-renders with agent state. Rendered inline
 * in SPRITES order to preserve the exact paint order.
 */
const StaticSprite = memo(function StaticSprite({ def }: { def: (typeof SPRITES)[number] }) {
  return (
    <img
      src={`/campus/${def.group}/${def.id}.png`}
      alt=""
      style={{ position: "absolute", left: def.x, top: def.y, width: def.w, height: def.h }}
    />
  );
});

/**
 * Layers, bottom to top: reference art → animated sprite patches → scene FX
 * (glows, steam, particles) → live speech bubbles. Motion intensity follows
 * the real backend agent status.
 */
export default function CampusMap() {
  const { data: agents } = useAgents();
  const working = useMemo(
    () => new Set<AgentLocation>(agents.filter((a) => a.status === "working").map((a) => a.location)),
    [agents],
  );

  return (
    <div
      data-intro="map"
      style={{
        position: "absolute",
        inset: 0,
        // Optimized WebP (same 1536x1024 art, visually identical to the
        // PNG). The source art stays preserved as campus-reference.png.
        backgroundImage: "url(/campus/backgrounds/campus-scene.webp)",
        backgroundSize: "100% 100%",
      }}
    >
      {SPRITES.map((def) => {
        if (def.kind.startsWith("rally")) return null; // BadmintonRally owns these
        if (def.kind === "static") return <StaticSprite key={def.id} def={def} />;
        const locs = SPRITE_LOCATIONS[def.id];
        return <AgentSprite key={def.id} def={def} status={locs ? pickAgent(agents, locs)?.status : undefined} />;
      })}
      <BadmintonRally />

      <Twinkle />
      <Monitors working={working} />
      <Lamps />
      <Steam />
      <AmbientParticles />
      <Emote x={1088} y={496} glyph="♡" color="#ff8fb1" on />
      <Emote x={668} y={530} glyph="♪" color="#ffe9a8" on />
      <Emote x={738} y={208} glyph="✦" color="#9fe8ff" on={working.has("editorial-room")} every={1.6} />
      <Emote x={320} y={704} glyph="✦" color="#ffd18a" on={working.has("visual-studio")} every={1.6} />

      {BUBBLES.map((spec) => {
        const agent = pickAgent(agents, spec.locations);
        return (
          <AgentBubble
            key={spec.room}
            spec={spec}
            text={agent ? bubbleFor(agent) : spec.fallback}
            status={agent?.status}
            title={agent ? `${agent.name} · ${agent.role}` : undefined}
          />
        );
      })}
    </div>
  );
}
