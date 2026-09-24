"use client";

import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import type { SpriteDef } from "@/lib/sprites";
import type { AgentStatus } from "@/types/agent";

// How lively the loop runs for each real backend status.
const SPEED: Record<AgentStatus, number> = {
  working: 1.5, idle: 0.8, walking: 1.2, waiting: 0.6, completed: 1, error: 2.6,
};

const QUIPS = [
  "On it!",
  "Ship it!",
  "One more draft…",
  "Coffee first.",
  "The lede writes itself.",
  "Fact-check o'clock.",
  "No typos on my watch.",
  "Hot off the press!",
];

function build(el: HTMLElement, def: SpriteDef) {
  const tl = gsap.timeline({ repeat: -1 });
  const dir = def.id === "cafe-black" ? -1 : 1;
  gsap.set(el, { transformOrigin: "50% 100%" });

  switch (def.kind) {
    case "typist": // head bob + typing shake
      tl.to(el, { y: -1.5, rotation: 0.9, duration: 0.45, ease: "sine.inOut" })
        .to(el, { y: 0.5, rotation: -0.7, duration: 0.4, ease: "sine.inOut" })
        .to(el, { y: -1, rotation: 0.3, scaleY: 1.02, duration: 0.3, ease: "sine.inOut" })
        .to(el, { y: 0, rotation: 0, scaleY: 1, duration: 0.5, ease: "power2.out" });
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
    // Decor vegetation stays perfectly still (the sway looked odd).
    case "sway":
    case "tree":
      break;
  }
  tl.time(rand(0, tl.duration())); // desync neighbours
  return tl;
}

/**
 * The "life" layer: breathing + blinking on the outer wrap, so it composes
 * with the kind-specific loop on the inner image. Every character breathes;
 * every few seconds it blinks (a quick squash reads as a blink).
 */
function buildLife(wrap: HTMLElement) {
  gsap.set(wrap, { transformOrigin: "50% 100%" });
  const life = gsap.timeline({ repeat: -1 });
  life
    .to(wrap, { scaleY: 1.022, scaleX: 0.996, duration: 1.7, ease: "sine.inOut" })
    .to(wrap, { scaleY: 0.9, duration: 0.07, ease: "power1.in" }) // blink shut
    .to(wrap, { scaleY: 1.022, duration: 0.13, ease: "power1.out" }) // blink open
    .to(wrap, { scaleY: 1, scaleX: 1, duration: 1.7, ease: "sine.inOut" })
    .to(wrap, { duration: rand(1.4, 3.4) }); // pause between blinks
  life.time(rand(0, life.duration())); // desync neighbours
  return life;
}

export default memo(function AgentSprite({ def, status }: { def: SpriteDef; status?: AgentStatus }) {
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const burstHost = useRef<HTMLDivElement>(null);
  const loop = useRef<gsap.core.Timeline | null>(null);
  const prev = useRef<AgentStatus | undefined>(status);
  const [quip, setQuip] = useState<string | null>(null);
  const quipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Characters (not decor, not the rally cats) react to hover and clicks.
  const interactive = def.group === "characters" && !def.kind.startsWith("rally");

  useEffect(() => {
    if (!img.current || !motionOK()) return;
    const ctx = gsap.context(() => {
      loop.current = build(img.current!, def);
    });
    return () => ctx.revert();
  }, [def]);

  // Breathing + blinking life layer — characters only. Decor (trees, bushes,
  // flowers, sprite plants) stays perfectly still.
  useEffect(() => {
    if (!wrap.current || !motionOK()) return;
    if (def.group !== "characters") return;
    const life = buildLife(wrap.current);
    return () => {
      life.kill();
    };
  }, [def]);

  // Campus-wide mood reactions: celebration hops, rally shakes — characters only.
  useEffect(() => {
    const w = wrap.current;
    if (!w || def.group !== "characters") return;
    const celebrate = () => {
      if (!motionOK()) return;
      gsap.fromTo(w, { y: 0 }, { y: -14, duration: 0.26, yoyo: true, repeat: 1, ease: "power2.out" });
    };
    const rally = () => {
      if (!motionOK()) return;
      gsap.fromTo(
        w,
        { rotation: -4 },
        { rotation: 4, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut", onComplete: () => gsap.set(w, { rotation: 0 }) },
      );
    };
    window.addEventListener("campus:celebrate", celebrate);
    window.addEventListener("campus:rally", rally);
    return () => {
      window.removeEventListener("campus:celebrate", celebrate);
      window.removeEventListener("campus:rally", rally);
    };
  }, [def]);

  useEffect(() => {
    const w = wrap.current;
    loop.current?.timeScale(status ? SPEED[status] : 1);
    // hop when the real agent state flips
    if (w && prev.current && status && prev.current !== status && motionOK()) {
      gsap.fromTo(w, { y: 0 }, { y: -6, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    prev.current = status;

    // Continuous flavour per status: error trembles, completed hops with joy.
    if (!w || !motionOK()) return;
    let fx: gsap.core.Tween | undefined;
    let alive = true;
    if (status === "error") {
      gsap.set(w, { rotation: -2 });
      fx = gsap.to(w, { x: 2.5, duration: 0.09, yoyo: true, repeat: -1, ease: "sine.inOut" });
    } else if (status === "completed") {
      const hop = () => {
        if (!alive) return;
        gsap.fromTo(w, { y: 0 }, { y: -9, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
        fx = gsap.delayedCall(rand(2.5, 5), hop);
      };
      fx = gsap.delayedCall(rand(0.5, 2), hop);
    }
    return () => {
      alive = false;
      fx?.kill();
      gsap.set(w, { x: 0, rotation: 0 });
    };
  }, [status]);

  useEffect(
    () => () => {
      if (quipTimer.current) clearTimeout(quipTimer.current);
    },
    [],
  );

  /** A little burst of sparkles above the character. */
  const burst = () => {
    const host = burstHost.current;
    if (!host || !motionOK()) return;
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("span");
      el.textContent = ["✦", "✧", "❀"][i % 3];
      Object.assign(el.style, {
        position: "absolute",
        left: `${rand(8, def.w - 8)}px`,
        top: "0px",
        fontSize: "13px",
        color: ["#ffd98a", "#9fe8ff", "#ffb1c8"][i % 3],
        textShadow: "0 0 4px rgba(0,0,0,.4)",
        pointerEvents: "none",
      });
      host.appendChild(el);
      gsap.fromTo(
        el,
        { y: 6, opacity: 0, scale: 0.5 },
        {
          y: -rand(28, 52),
          x: rand(-14, 14),
          opacity: 1,
          scale: rand(0.9, 1.3),
          duration: rand(0.7, 1.1),
          delay: i * 0.05,
          ease: "power2.out",
          onComplete: () => el.remove(),
        },
      );
      gsap.to(el, { opacity: 0, duration: 0.4, delay: 0.7 + i * 0.05 });
    }
  };

  const say = (text: string) => {
    setQuip(text);
    if (quipTimer.current) clearTimeout(quipTimer.current);
    quipTimer.current = setTimeout(() => setQuip(null), 2400);
  };

  const hop = () => {
    if (wrap.current && motionOK())
      gsap.fromTo(wrap.current, { y: 0 }, { y: -8, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
  };

  const spin = () => {
    if (!wrap.current || !motionOK()) return;
    gsap.to(wrap.current, { rotation: "+=360", duration: 0.7, ease: "back.out(1.4)" });
    burst();
    say(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  };

  return (
    <div
      ref={wrap}
      data-sprite-id={def.id}
      onMouseEnter={interactive ? hop : undefined}
      onClick={interactive ? spin : undefined}
      title={interactive ? "Say hi!" : undefined}
      style={{
        position: "absolute",
        left: def.x,
        top: def.y,
        width: def.w,
        height: def.h,
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "pointer" : undefined,
      }}
    >
      <div ref={img} style={{ width: "100%", height: "100%" }}>
        <Image
          src={`/campus/${def.group}/${def.id}.png`}
          alt=""
          width={def.w}
          height={def.h}
          draggable={false}
          style={{ width: "100%", height: "100%", display: "block" }}
          unoptimized
        />
      </div>
      {/* sparkle bursts + speech */}
      <div ref={burstHost} style={{ position: "absolute", left: 0, top: -6, width: "100%", height: 0, pointerEvents: "none" }} />
      {quip && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "100%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            whiteSpace: "nowrap",
            background: "#fbf6e6",
            border: "2px solid #3b2d3c",
            borderRadius: 8,
            padding: "4px 10px",
            color: "#2b2233",
            fontFamily: "var(--font-pixel)",
            fontSize: 13,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {quip}
          <span
            style={{
              position: "absolute",
              left: "50%",
              bottom: -6,
              width: 9,
              height: 9,
              marginLeft: -5,
              background: "#fbf6e6",
              borderRight: "2px solid #3b2d3c",
              borderBottom: "2px solid #3b2d3c",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
    </div>
  );
});
