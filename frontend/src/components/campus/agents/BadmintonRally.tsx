"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import { SPRITES } from "@/lib/sprites";

const L = SPRITES.find((s) => s.id === "badminton-orange")!;
const R = SPRITES.find((s) => s.id === "badminton-grey")!;
const A = { x: 926, y: 736 }; // racket contact, left cat
const B = { x: 1030, y: 736 }; // racket contact, right cat
const FLIGHT = 0.9;

/** Endless rally: shuttle arcs over the net, each cat hops and swings. */
export default function BadmintonRally() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      const catL = ".rally-l", catR = ".rally-r", sh = ".rally-shuttle";
      gsap.set([catL, catR], { transformOrigin: "50% 100%" });
      gsap.set(sh, { x: 0, y: 0 });

      const swing = (c: string, lean: number) =>
        gsap.timeline()
          .to(c, { y: -7, rotation: lean, duration: 0.12, ease: "power2.out" })
          .to(c, { y: 0, rotation: 0, duration: 0.3, ease: "bounce.out" });

      const fly = (dx: number, spin: number) =>
        gsap.timeline()
          .to(sh, { x: dx, duration: FLIGHT, ease: "none" }, 0)
          .to(sh, { y: -30, duration: FLIGHT / 2, ease: "power2.out" }, 0)
          .to(sh, { y: 0, duration: FLIGHT / 2, ease: "power2.in" }, FLIGHT / 2)
          .to(sh, { rotation: spin, duration: FLIGHT, ease: "none" }, 0);

      const rally = gsap.timeline({ repeat: -1 });
      rally
        .add(swing(catL, 8))
        .add(fly(B.x - A.x, 200), "<0.05")
        .add(swing(catR, -8), `>-0.12`)
        .add(fly(0, 20), "<0.05");
    }, root);
    return () => ctx.revert();
  }, []);

  const cat = (d: typeof L, cls: string) => (
    <Image
      className={cls}
      src={`/campus/characters/${d.id}.png`}
      alt=""
      width={d.w}
      height={d.h}
      draggable={false}
      style={{ position: "absolute", left: d.x, top: d.y }}
      unoptimized
    />
  );

  return (
    <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {cat(L, "rally-l")}
      {cat(R, "rally-r")}
      <svg
        className="rally-shuttle"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        style={{ position: "absolute", left: A.x - 8, top: A.y - 8, overflow: "visible" }}
      >
        <path d="M5.5 10.5 L13 2.5 L15 6.5 Z" fill="#fff" stroke="#3b2d3c" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="4" cy="12" r="2.6" fill="#f3d9a6" stroke="#3b2d3c" strokeWidth="1" />
      </svg>
    </div>
  );
}
