"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";

/** Tiny glyphs that float up from a character while `on` is true. */
export default function Emote({
  x, y, glyph, color, on, every = 3,
}: { x: number; y: number; glyph: string; color: string; on: boolean; every?: number }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!on || !root.current || !motionOK()) return;
    const host = root.current;
    let alive = true;
    let timer: gsap.core.Tween | undefined;

    const emit = () => {
      if (!alive) return;
      const el = document.createElement("span");
      el.textContent = glyph;
      Object.assign(el.style, { position: "absolute", left: "0", top: "0", fontSize: "13px", color, textShadow: "0 0 4px rgba(0,0,0,.35)" });
      host.appendChild(el);
      gsap.fromTo(
        el,
        { y: 0, x: rand(-4, 4), opacity: 0, scale: 0.6 },
        { y: -26, x: `+=${rand(-8, 8)}`, opacity: 1, scale: 1.1, duration: 1.4, ease: "power1.out", onComplete: () => el.remove() },
      );
      gsap.to(el, { opacity: 0, duration: 0.5, delay: 0.9 });
      timer = gsap.delayedCall(rand(every * 0.7, every * 1.3), emit);
    };
    timer = gsap.delayedCall(rand(0, every), emit);

    return () => {
      alive = false;
      timer?.kill();
      gsap.killTweensOf(Array.from(host.children));
      host.replaceChildren();
    };
  }, [on, glyph, color, every]);

  return <div ref={root} style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }} />;
}
