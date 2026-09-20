"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import { STEAMS } from "@/lib/scenery";

/** Curling steam over the cafe cups. */
export default function Steam() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".steam-puff").forEach((p, i) => {
        gsap.to(p, {
          keyframes: {
            y: [0, -9, -20],
            x: [0, i % 2 ? 4 : -4, i % 2 ? -2 : 3],
            opacity: [0, 0.55, 0],
            scale: [0.6, 1.1, 1.7],
            easeEach: "none",
          },
          duration: 2.4,
          repeat: -1,
          delay: (i % 3) * 0.8 + Math.floor(i / 3) * 0.2,
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {STEAMS.flatMap((s, si) =>
        [0, 1, 2].map((n) => (
          <span
            key={`${si}-${n}`}
            className="steam-puff"
            style={{
              position: "absolute",
              left: s.x - 3,
              top: s.y - 6,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.75)",
              filter: "blur(1.5px)",
              opacity: 0,
            }}
          />
        )),
      )}
    </div>
  );
}
