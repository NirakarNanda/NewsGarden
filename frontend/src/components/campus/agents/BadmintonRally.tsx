"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { SPRITES } from "@/lib/sprites";

const L = SPRITES.find((s) => s.id === "badminton-orange")!;
const R = SPRITES.find((s) => s.id === "badminton-grey")!;
const A = { x: 926, y: 736 }; // racket contact, left cat
const B = { x: 1030, y: 736 }; // racket contact, right cat
const DX = B.x - A.x;

/**
 * Endless rally, now with a pulse: rallies vary (drives, lobs, smashes),
 * points are scored, and the winner celebrates while the loser sulks.
 * The score bubble pops above the net.
 */
export default function BadmintonRally() {
  const root = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      const catL = ".rally-l";
      const catR = ".rally-r";
      const sh = ".rally-shuttle";
      const score = { l: 0, r: 0 };
      gsap.set([catL, catR], { transformOrigin: "50% 100%" });
      gsap.set(sh, { x: 0, y: 0, rotation: 0 });

      const setScore = () => {
        if (!scoreRef.current) return;
        scoreRef.current.textContent = `${score.l} – ${score.r}`;
        gsap.fromTo(scoreRef.current, { scale: 1.4 }, { scale: 1, duration: 0.45, ease: "back.out(2.2)" });
      };

      const swing = (c: string, lean: number, big = false) =>
        gsap
          .timeline()
          .to(c, { y: big ? -13 : -7, rotation: lean, duration: big ? 0.1 : 0.12, ease: "power2.out" })
          .to(c, { y: 0, rotation: 0, duration: 0.3, ease: "bounce.out" });

      /** Shuttle flight from one contact point to the other. */
      const fly = (toRight: boolean, arc: number, dur: number, spin: number) =>
        gsap
          .timeline()
          .to(sh, { x: toRight ? `+=${DX}` : `-=${DX}`, duration: dur, ease: "none" }, 0)
          .to(sh, { y: arc, duration: dur / 2, ease: "power2.out" }, 0)
          .to(sh, { y: 0, duration: dur / 2, ease: "power2.in" }, dur / 2)
          .to(sh, { rotation: `+=${spin}`, duration: dur, ease: "none" }, 0);

      const celebrate = (winner: string, loser: string) => {
        const tl = gsap.timeline();
        // winner: triple happy hop
        tl.to(winner, { y: -14, duration: 0.2, ease: "power2.out" })
          .to(winner, { y: 0, duration: 0.25, ease: "bounce.out" })
          .to(winner, { y: -10, duration: 0.18, ease: "power2.out" })
          .to(winner, { y: 0, duration: 0.25, ease: "bounce.out" });
        // loser: sulky crouch
        tl.to(loser, { y: 5, scaleY: 0.94, duration: 0.4, ease: "sine.inOut" }, 0)
          .to(loser, { y: 0, scaleY: 1, duration: 0.4, ease: "sine.inOut" }, 0.9);
        // sparkle burst over the winner
        const host = root.current;
        if (host) {
          for (let i = 0; i < 8; i++) {
            const el = document.createElement("span");
            el.textContent = ["✦", "✧"][i % 2];
            const wx = winner === catL ? A.x + 30 : B.x + 30;
            Object.assign(el.style, {
              position: "absolute",
              left: `${wx + rand(-14, 14)}px`,
              top: `${A.y - 20}px`,
              fontSize: "14px",
              color: i % 2 ? "#9fe8ff" : "#ffd98a",
              textShadow: "0 0 4px rgba(0,0,0,.4)",
              pointerEvents: "none",
            });
            host.appendChild(el);
            gsap.fromTo(
              el,
              { y: 8, opacity: 0, scale: 0.5 },
              {
                y: -rand(36, 64),
                x: rand(-18, 18),
                opacity: 1,
                scale: rand(0.9, 1.3),
                duration: rand(0.8, 1.2),
                delay: i * 0.06,
                ease: "power2.out",
                onComplete: () => el.remove(),
              },
            );
            gsap.to(el, { opacity: 0, duration: 0.5, delay: 0.8 + i * 0.06 });
          }
        }
        return tl;
      };

      /** One point: a rally of 2–5 exchanges, ending in a smash winner. */
      const playPoint = () => {
        // The shuttle's x is relative and accumulates across exchanges —
        // snap it back to the server's racket or it drifts out of the court.
        gsap.set(sh, { x: 0, y: 0 });
        const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1.15, playPoint) });
        const exchanges = 2 + Math.floor(Math.random() * 4);
        let toRight = true; // left cat serves first

        for (let i = 0; i < exchanges; i++) {
          const last = i === exchanges - 1;
          const smash = last; // every point ends with a smash
          const lob = !last && Math.random() < 0.28;
          const dur = smash ? rand(0.38, 0.5) : lob ? rand(1.1, 1.35) : rand(0.75, 1.0);
          const arc = smash ? -16 : lob ? rand(-70, -58) : rand(-34, -26);
          const hitter = toRight ? catL : catR;
          const receiver = toRight ? catR : catL;

          tl.add(swing(hitter, toRight ? 8 : -8, smash));
          tl.add(fly(toRight, arc, dur, smash ? 320 : 200), "<0.05");

          if (smash) {
            // receiver dives and misses
            tl.add(gsap.to(receiver, { rotation: toRight ? -16 : 16, y: 6, duration: 0.28, ease: "power2.in" }), "<0.12");
            tl.add(() => {
              if (toRight) score.l++;
              else score.r++;
              setScore();
            }, "+=0.1");
            tl.add(celebrate(hitter, receiver), "+=0.15");
            tl.add(gsap.to([catL, catR], { rotation: 0, duration: 0.35, ease: "sine.out" }), "+=0.4");
          } else if (!last) {
            // receiver scrambles into position early
            tl.add(gsap.to(receiver, { y: -4, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut" }), `>-0.25`);
          }
          toRight = !toRight;
        }
      };

      setScore();
      playPoint();
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
      {/* score bubble above the net */}
      <div
        ref={scoreRef}
        className="rally-score"
        style={{
          position: "absolute",
          left: (A.x + B.x) / 2 - 34,
          top: 668,
          width: 68,
          textAlign: "center",
          background: "#fbf6e6",
          border: "2px solid #3b2d3c",
          borderRadius: 9,
          padding: "3px 0",
          color: "#2b2233",
          fontFamily: "var(--font-pixel)",
          fontSize: 14,
        }}
      />
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
