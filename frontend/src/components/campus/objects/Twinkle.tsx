"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { LEDS, STARS } from "@/lib/scenery";

/** Twinkling poster stars + blinking vending-machine lights. */
export default function Twinkle() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".star").forEach((s) => {
        gsap.fromTo(
          s,
          { opacity: 0.15, scale: 0.6 },
          { opacity: 1, scale: 1.4, duration: rand(0.7, 1.6), yoyo: true, repeat: -1, ease: "sine.inOut", delay: rand(0, 2) },
        );
      });
      gsap.utils.toArray<HTMLElement>(".led").forEach((l) => {
        gsap.fromTo(l, { opacity: 0.2 }, { opacity: 1, duration: 0.01, repeat: -1, repeatDelay: rand(0.6, 1.8), yoyo: true, delay: rand(0, 1.5) });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{ position: "absolute", left: s.x, top: s.y, width: 3, height: 3, background: "#fff8d8", boxShadow: "0 0 4px #fff8d8" }}
        />
      ))}
      {LEDS.map((l, i) => (
        <span
          key={i}
          className="led"
          style={{ position: "absolute", left: l.x, top: l.y, width: 3, height: 3, background: l.c, boxShadow: `0 0 5px ${l.c}` }}
        />
      ))}
    </div>
  );
}
