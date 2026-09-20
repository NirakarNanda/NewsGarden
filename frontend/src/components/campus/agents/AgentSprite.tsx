"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import type { SpriteDef } from "@/lib/sprites";
import type { AgentStatus } from "@/types/agent";

// How lively the loop runs for each real backend status.
const SPEED: Record<AgentStatus, number> = {
  working: 1.5, idle: 0.8, walking: 1.2, waiting: 0.6, completed: 1, error: 2.6,
};

function build(el: HTMLElement, def: SpriteDef) {
  const tl = gsap.timeline({ repeat: -1 });
  const dir = def.id === "cafe-black" ? -1 : 1;
  gsap.set(el, { transformOrigin: "50% 100%" });

  switch (def.kind) {
    case "typist": // head bob + typing shake
      tl.to(el, { y: -1.5, rotation: 0.9, duration: 0.45, ease: "sine.inOut" })
        .to(el, { y: 0.5, rotation: -0.7, duration: 0.4, ease: "sine.inOut" })
        .to(el, { y: -1, rotation: 0.3, scaleY: 1.02, duration: 0.3, ease: "sine.inOut" })
        .to(el, { y: 0, rotation: 0, scaleY: 1, duration: 0.5, ease: "sine.inOut" });
      break;
    case "sip": // relax, lean in for a sip, lean back
      tl.to(el, { y: -1, rotation: -1.2 * dir, duration: 1.4, ease: "sine.inOut" })
        .to(el, { y: 0, rotation: 0.6 * dir, duration: 1.2, ease: "sine.inOut" })
        .to(el, { y: 1.5, rotation: 4 * dir, duration: 0.35, ease: "power2.out" })
        .to(el, { duration: 0.6 })
        .to(el, { y: 0, rotation: 0, duration: 0.5, ease: "power2.inOut" });
      break;
    case "reader": // slow sway, then a page-turn nod
      tl.to(el, { y: -1, rotation: 1.2, duration: 1.6, ease: "sine.inOut" })
        .to(el, { y: 0, rotation: -1.2, duration: 1.6, ease: "sine.inOut" })
        .to(el, { y: 1.5, rotation: 2.5, duration: 0.25, ease: "power2.out" })
        .to(el, { y: 0, rotation: 0, duration: 0.5, ease: "back.out(2)" });
      break;
    case "pet":
      if (def.id === "pig") {
        tl.to(el, { duration: 1.6 })
          .to(el, { y: -5, rotation: -6, duration: 0.16, ease: "power2.out" })
          .to(el, { y: 0, rotation: 0, duration: 0.3, ease: "bounce.out" })
          .to(el, { y: -3, rotation: 5, duration: 0.14, ease: "power2.out" })
          .to(el, { y: 0, rotation: 0, duration: 0.26, ease: "bounce.out" });
      } else {
        tl.to(el, { scaleY: 1.04, scaleX: 0.99, duration: 1.8, ease: "sine.inOut" })
          .to(el, { scaleY: 1, scaleX: 1, duration: 1.8, ease: "sine.inOut" });
      }
      break;
    case "float": // zero-g plush
      gsap.set(el, { transformOrigin: "50% 50%" });
      tl.to(el, { y: -3, rotation: 2.5, duration: 2.2, ease: "sine.inOut" })
        .to(el, { y: 2, rotation: -2.5, duration: 2.6, ease: "sine.inOut" });
      break;
    case "sway":
      tl.to(el, { skewX: rand(1.8, 3), duration: rand(2.2, 3.4), ease: "sine.inOut" })
        .to(el, { skewX: -rand(1.8, 3), duration: rand(2.2, 3.4), ease: "sine.inOut" });
      break;
    case "tree":
      tl.to(el, { skewX: 1.6, scaleY: 1.008, duration: rand(3, 4.2), ease: "sine.inOut" })
        .to(el, { skewX: -1.6, scaleY: 1, duration: rand(3, 4.2), ease: "sine.inOut" });
      break;
  }
  tl.time(rand(0, tl.duration())); // desync neighbours
  return tl;
}

export default function AgentSprite({ def, status }: { def: SpriteDef; status?: AgentStatus }) {
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const loop = useRef<gsap.core.Timeline | null>(null);
  const prev = useRef<AgentStatus | undefined>(status);

  useEffect(() => {
    if (!img.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      loop.current = build(img.current!, def);
    });
    return () => ctx.revert();
  }, [def]);

  useEffect(() => {
    loop.current?.timeScale(status ? SPEED[status] : 1);
    // hop when the real agent state flips
    if (wrap.current && prev.current && status && prev.current !== status && motionOK()) {
      gsap.fromTo(wrap.current, { y: 0 }, { y: -6, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    prev.current = status;
  }, [status]);

  return (
    <div
      ref={wrap}
      style={{ position: "absolute", left: def.x, top: def.y, width: def.w, height: def.h, pointerEvents: "none" }}
    >
      <img
        ref={img}
        src={`/campus/${def.group}/${def.id}.png`}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
