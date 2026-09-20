"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";

/** Potted plant with a gently swaying canopy. */
export default function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 60;
  const h = 92;
  const leaves = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!leaves.current || !motionOK()) return;
    gsap.set(leaves.current, { transformOrigin: "50% 100%" });
    const tween = gsap.to(leaves.current, {
      skewX: 2.4,
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w * scale, height: h * scale, pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        <g ref={leaves}>
          <ellipse cx="30" cy="26" rx="16" ry="20" fill="#3f7a44" />
          <ellipse cx="18" cy="34" rx="10" ry="14" fill="#4d8f52" transform="rotate(-18 18 34)" />
          <ellipse cx="42" cy="34" rx="10" ry="14" fill="#4d8f52" transform="rotate(18 42 34)" />
          <ellipse cx="30" cy="16" rx="9" ry="12" fill="#5da364" />
          <rect x="28" y="34" width="4" height="22" fill="#4a6b3a" />
        </g>
        {/* pot */}
        <polygon points="16,56 44,56 40,86 20,86" fill="#b5653f" />
        <rect x="14" y="52" width="32" height="7" rx="2" fill="#c97a4e" />
        <polygon points="16,56 44,56 40,62 20,62" fill="#8a4a2c" opacity="0.5" />
      </svg>
    </div>
  );
}
