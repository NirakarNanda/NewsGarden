"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { LAMPS } from "@/lib/scenery";

function Glow({ x, y, r }: { x: number; y: number; r: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !motionOK()) return;
    const tween = gsap.to(ref.current, {
      opacity: () => rand(0.28, 0.62),
      scale: () => rand(0.92, 1.08),
      duration: 0.9,
      repeat: -1,
      repeatRefresh: true,
      yoyo: true,
      ease: "sine.inOut",
      delay: rand(0, 1.5),
    });
    return () => {
      tween.kill();
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        opacity: 0.42,
        mixBlendMode: "screen",
        background: "radial-gradient(circle, rgba(255,196,110,0.55) 0%, rgba(255,170,80,0.18) 45%, transparent 70%)",
      }}
    />
  );
}

/** Warm, gently flickering light pools over every lamp. */
export default function Lamps() {
  return (
    <>
      {LAMPS.map((l, i) => (
        <Glow key={i} {...l} />
      ))}
    </>
  );
}
