"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";

/** Ambient chatter: thought bubbles pop over random characters, sometimes answered. */

const LINES = [
  "One more draft…",
  "Is it Friday yet?",
  "The lede writes itself.",
  "Needs more coffee.",
  "Did anyone fact-check the moon?",
  "Headline's cooking…",
  "Print is not dead.",
  "Chase the story, not the clock.",
  "Second source, always.",
  "This paragraph sings.",
];

const REPLIES = [
  "On it!",
  "Already filed.",
  "Give me five minutes.",
  "Tell me about it.",
  "Ship it!",
];

// Bubble anchors: just above each character's head (design px).
const SPOTS = [
  { x: 351, y: 168 }, // newsroom-cat
  { x: 724, y: 192 }, // editorial-cat
  { x: 1059, y: 180 }, // design-cat
  { x: 313, y: 466 }, // raccoon
  { x: 303, y: 688 }, // visual-cat
  { x: 661, y: 510 }, // cafe-calico
  { x: 760, y: 494 }, // cafe-black
  { x: 1083, y: 480 }, // manga-bunny
  { x: 975, y: 142 }, // gold-cat
  { x: 1148, y: 792 }, // pig
];

interface Bubble {
  id: number;
  x: number;
  y: number;
  text: string;
}

let nextId = 1;

function BubbleView({ b }: { b: Bubble }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !motionOK()) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.6, opacity: 0, y: 6 },
      { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" },
    );
    const float = gsap.to(ref.current, { y: -3, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return () => {
      float.kill();
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        transform: "translate(-50%, -100%)",
        whiteSpace: "nowrap",
        background: "#fbf6e6",
        border: "2px solid #3b2d3c",
        borderRadius: 8,
        padding: "5px 11px",
        color: "#2b2233",
        fontFamily: "var(--font-pixel)",
        fontSize: 13,
        pointerEvents: "none",
        zIndex: 6,
      }}
    >
      {b.text}
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
  );
}

export default function CampusChatter() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    if (!motionOK()) return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const say = (spot: (typeof SPOTS)[number], text: string, ttl: number) => {
      const id = nextId++;
      setBubbles((bs) => [...bs.slice(-3), { id, x: spot.x, y: spot.y, text }]);
      timers.push(setTimeout(() => {
        if (alive) setBubbles((bs) => bs.filter((b) => b.id !== id));
      }, ttl));
    };

    const chatter = () => {
      if (!alive) return;
      const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
      say(spot, LINES[Math.floor(Math.random() * LINES.length)], 2800);
      // Sometimes a neighbour answers.
      if (Math.random() < 0.35) {
        const others = SPOTS.filter((s) => s !== spot);
        const pal = others[Math.floor(Math.random() * others.length)];
        timers.push(setTimeout(() => {
          if (alive) say(pal, REPLIES[Math.floor(Math.random() * REPLIES.length)], 2200);
        }, 1300));
      }
      timers.push(setTimeout(chatter, rand(11000, 19000)));
    };
    timers.push(setTimeout(chatter, rand(5000, 9000)));

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {bubbles.map((b) => (
        <BubbleView key={b.id} b={b} />
      ))}
    </div>
  );
}
