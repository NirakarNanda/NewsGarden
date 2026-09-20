"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";

const DUST = Array.from({ length: 22 }, (_, i) => ({
  x: 150 + ((i * 197) % 1080),
  y: 40 + ((i * 131) % 780),
}));
const FLIES = [
  ...Array.from({ length: 5 }, (_, i) => ({ x: 150 + i * 55, y: 872 + (i % 3) * 14 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: 850 + i * 65, y: 870 + (i % 3) * 14 })),
];
const LEAF_FROM = [{ x: 445, y: 836 }, { x: 470, y: 846 }, { x: 765, y: 830 }, { x: 800, y: 842 }, { x: 785, y: 826 }];

/** Dust motes, fireflies over the grass and leaves drifting off the trees. */
export default function AmbientParticles() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".dust").forEach((d) => {
        gsap.to(d, {
          x: () => rand(-30, 30),
          y: () => rand(-24, 24),
          opacity: () => rand(0.1, 0.65),
          duration: () => rand(4, 8),
          repeat: -1,
          repeatRefresh: true,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      gsap.utils.toArray<HTMLElement>(".firefly").forEach((f) => {
        const wander = () =>
          gsap.to(f, { x: `+=${rand(-40, 40)}`, y: `+=${rand(-14, 10)}`, duration: rand(2, 4), ease: "sine.inOut", onComplete: wander });
        wander();
        gsap.fromTo(f, { opacity: 0.1 }, { opacity: 1, duration: rand(0.6, 1.2), yoyo: true, repeat: -1, ease: "sine.inOut", delay: rand(0, 2) });
      });

      gsap.utils.toArray<HTMLElement>(".leaf").forEach((l, i) => {
        gsap.fromTo(
          l,
          { x: 0, y: 0, rotation: 0, opacity: 0 },
          {
            keyframes: {
              x: [0, 14, -6, 12, 4],
              y: [0, 20, 42, 62, 80],
              rotation: [0, 70, 150, 230, 320],
              opacity: [0, 1, 1, 0.8, 0],
              easeEach: "sine.inOut",
            },
            duration: rand(5, 7.5),
            repeat: -1,
            delay: i * 1.6 + rand(0, 2),
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {DUST.map((d, i) => (
        <span key={i} className="dust" style={{ position: "absolute", left: d.x, top: d.y, width: 2, height: 2, background: "#fff0c8", opacity: 0.3, borderRadius: 1 }} />
      ))}
      {FLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={{ position: "absolute", left: f.x, top: f.y, width: 3, height: 3, borderRadius: "50%", background: "#eaff8a", boxShadow: "0 0 8px 2px rgba(220,255,120,0.8)", opacity: 0.2 }}
        />
      ))}
      {LEAF_FROM.map((l, i) => (
        <span key={i} className="leaf" style={{ position: "absolute", left: l.x, top: l.y, width: 7, height: 4, borderRadius: "70% 30% 70% 30%", background: "#66b34f", opacity: 0 }} />
      ))}
    </div>
  );
}
