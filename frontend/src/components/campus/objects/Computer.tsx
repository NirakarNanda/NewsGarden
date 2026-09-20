"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { MONITORS } from "@/lib/scenery";
import type { AgentLocation } from "@/types/agent";

function Screen({ m, active }: { m: (typeof MONITORS)[number]; active: boolean }) {
  const glow = useRef<HTMLDivElement>(null);
  const scan = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glow.current || !scan.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      // Busy screens flicker hard and run a scanline; idle ones just breathe.
      gsap.to(glow.current, {
        opacity: () => (active ? rand(0.15, 0.38) : rand(0.05, 0.14)),
        duration: active ? 0.22 : 1.4,
        repeat: -1,
        repeatRefresh: true,
        ease: active ? "steps(2)" : "sine.inOut",
        delay: rand(0, 1),
      });
      gsap.fromTo(
        scan.current,
        { y: -4 },
        { y: m.h, duration: active ? 1.1 : 3.2, repeat: -1, ease: "none", delay: rand(0, 1) },
      );
    });
    return () => ctx.revert();
  }, [active, m.h]);

  return (
    <div
      style={{
        position: "absolute",
        left: m.x,
        top: m.y,
        width: m.w,
        height: m.h,
        overflow: "hidden",
        borderRadius: 2,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    >
      <div
        ref={glow}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          background: `linear-gradient(180deg, rgba(${m.tint},0.7), rgba(${m.tint},0.15))`,
        }}
      />
      <div
        ref={scan}
        style={{ position: "absolute", left: 0, right: 0, height: 3, background: `rgba(${m.tint},0.55)`, filter: "blur(1px)" }}
      />
    </div>
  );
}

export default function Monitors(_props: { working: Set<AgentLocation> }) {
  return null;
}
