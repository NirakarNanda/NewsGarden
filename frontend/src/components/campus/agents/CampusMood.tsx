"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { useNewsEvents } from "@/lib/socket";

/**
 * Campus-wide mood: the whole newsroom reacts to real backend events.
 *
 * - EDITION_APPROVED / EDITION_PUBLISHED / NEWSPAPER_COMPILED → confetti
 *   burst over the office + every character does a happy hop
 *   (via the `campus:celebrate` window event AgentSprite listens for).
 * - AGENT_TASK_FAILED / EDITION_REVISION_REQUESTED → a determined
 *   shake-it-off pulse over the quality room (`campus:rally`).
 * - EDITION_READY_FOR_APPROVAL → a soft chime shimmer over the office.
 *
 * Pure FX overlay: pointer-events none, no layout impact.
 */
export default function CampusMood() {
  const root = useRef<HTMLDivElement>(null);

  const burst = (
    x: number,
    y: number,
    glyphs: string[],
    colors: string[],
    n: number,
    spread = 90,
    rise = 110,
  ) => {
    const host = root.current;
    if (!host || !motionOK()) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.textContent = glyphs[i % glyphs.length];
      Object.assign(el.style, {
        position: "absolute",
        left: `${x + rand(-spread / 2, spread / 2)}px`,
        top: `${y + rand(-14, 14)}px`,
        fontSize: `${rand(11, 18)}px`,
        color: colors[i % colors.length],
        textShadow: "0 0 6px rgba(0,0,0,.45)",
        pointerEvents: "none",
      });
      host.appendChild(el);
      gsap.fromTo(
        el,
        { y: 10, opacity: 0, scale: 0.5, rotation: rand(-30, 30) },
        {
          y: -rand(rise * 0.5, rise),
          x: rand(-36, 36),
          opacity: 1,
          scale: rand(0.9, 1.4),
          rotation: rand(-90, 90),
          duration: rand(1.1, 1.9),
          delay: i * 0.055,
          ease: "power2.out",
          onComplete: () => el.remove(),
        },
      );
      gsap.to(el, { opacity: 0, duration: 0.6, delay: 1.2 + i * 0.055 });
    }
  };

  const celebrate = () => {
    burst(768, 150, ["✦", "❀", "✧", "❋"], ["#ffd98a", "#ffb1c8", "#9fe8ff", "#c8ffb1"], 26, 220, 130);
    window.dispatchEvent(new Event("campus:celebrate"));
  };

  const rally = () => {
    burst(340, 470, ["✦", "➤"], ["#9fe8ff", "#cfe6ff"], 10, 90, 70);
    window.dispatchEvent(new Event("campus:rally"));
  };

  const chime = () => {
    burst(768, 170, ["♪", "♫"], ["#ffe9a8", "#fff6d8"], 8, 160, 80);
  };

  useNewsEvents((e) => {
    if (e.type === "EDITION_APPROVED" || e.type === "EDITION_PUBLISHED" || e.type === "NEWSPAPER_COMPILED")
      celebrate();
    else if (e.type === "AGENT_TASK_FAILED" || e.type === "EDITION_REVISION_REQUESTED") rally();
    else if (e.type === "EDITION_READY_FOR_APPROVAL") chime();
  });

  return <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}
