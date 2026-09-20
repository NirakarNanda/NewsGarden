"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import { useNewsEvents } from "@/lib/socket";
import type { AgentInfo, AgentLocation } from "@/types/agent";

/** Walk targets in 1536x1024 stage pixels, read off the reference art. */
export const LOCATION_POINTS: Record<AgentLocation, { x: number; y: number }> = {
  newsroom: { x: 320, y: 200 },
  "research-lab": { x: 560, y: 440 },
  "editorial-room": { x: 700, y: 220 },
  "visual-studio": { x: 300, y: 710 },
  "design-studio": { x: 1040, y: 210 },
  "quality-room": { x: 300, y: 490 },
  cafe: { x: 680, y: 530 },
  "manga-library": { x: 1060, y: 510 },
  "badminton-court": { x: 950, y: 730 },
};

interface Target {
  point: { x: number; y: number };
  location: AgentLocation;
}

/**
 * Wraps an agent's sprite and walks it across the stage.
 * Reacts to AGENT_MOVEMENT_REQUESTED for this agent, and also follows
 * `agent.location` when the /api/agents poll reports a move.
 */
export default function AgentMovement({
  agent,
  children,
  onArrived,
}: {
  agent: AgentInfo;
  children: ReactNode;
  onArrived?: (location: AgentLocation) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => LOCATION_POINTS[agent.location] ?? LOCATION_POINTS.newsroom);
  const [target, setTarget] = useState<Target | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  const requestMove = (location: AgentLocation) => {
    const point = LOCATION_POINTS[location];
    if (!point) return;
    const cur = posRef.current;
    if (cur.x === point.x && cur.y === point.y) return;
    setTarget({ point, location });
  };

  // Event-driven moves.
  useNewsEvents((e) => {
    if (e.type !== "AGENT_MOVEMENT_REQUESTED" || e.agentId !== agent.id || !e.location) return;
    requestMove(e.location as AgentLocation);
  });

  // Poll-driven moves: follow the agent record.
  useEffect(() => {
    requestMove(agent.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.location]);

  // Animate toward the target.
  useEffect(() => {
    if (!target) return;
    if (!wrap.current || !motionOK()) {
      setPos(target.point);
      setTarget(null);
      onArrived?.(target.location);
      return;
    }
    const el = wrap.current;
    const dx = target.point.x - posRef.current.x;
    const dy = target.point.y - posRef.current.y;
    const dist = Math.hypot(dx, dy);
    const tween = gsap.to(el, {
      x: dx,
      y: dy,
      duration: Math.min(4, Math.max(0.6, dist / 220)),
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(el, { x: 0, y: 0 });
        setPos(target.point);
        setTarget(null);
        onArrived?.(target.location);
      },
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <div
      ref={wrap}
      data-agent={agent.id}
      data-walking={target !== null}
      style={{ position: "absolute", left: pos.x, top: pos.y }}
    >
      {children}
    </div>
  );
}
