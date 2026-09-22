"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";

/** One line for every hour — the newsroom always has something to say. */
const QUOTES: string[] = [
  "Midnight oil: every great edition starts as a stubborn idea.",
  "At 1 AM, the newsroom dreams in headlines.",
  "Night shift — the quiet hours do the deepest thinking.",
  "Even the moon fact-checks before it sets.",
  "Dawn is the newsroom's favorite deadline.",
  "First light, first draft.",
  "Good morning — the world filed overnight.",
  "Coffee first. Then the front page.",
  "A curious mind is the best morning edition.",
  "Nine o'clock: where questions become assignments.",
  "Mid-morning rule: every lead deserves a second source.",
  "Almost noon — chase the story, not the clock.",
  "Midday: the newsroom hums at full volume.",
  "Afternoon desks, evening headlines.",
  "A quiet hour is just a story gathering courage.",
  "Three PM: rewrite it shorter, make it sing.",
  "Golden hour for golden paragraphs.",
  "The day's notes become tomorrow's lede.",
  "Evening edition: today, distilled.",
  "Dinner can wait; the story can't.",
  "Night falls, curiosity rises.",
  "Nine PM: the editors sharpen their pencils.",
  "Late hours, lasting stories.",
  "Before midnight — one more good idea.",
];

const SERIF = "Georgia, 'Times New Roman', serif";

const currentHour = () => new Date().getHours();

/** Milliseconds until the next hour boundary, so the quote flips on the hour. */
function msToNextHour() {
  const n = new Date();
  return (60 - n.getMinutes()) * 60_000 - n.getSeconds() * 1000 - n.getMilliseconds() + 60;
}

export default function FooterBar() {
  const root = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const [hour, setHour] = useState(currentHour);
  const firstRender = useRef(true);

  // Flip the quote exactly on the hour, then every hour after.
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    const to = setTimeout(() => {
      setHour(currentHour());
      iv = setInterval(() => setHour(currentHour()), 3_600_000);
    }, msToNextHour());
    return () => {
      clearTimeout(to);
      if (iv) clearInterval(iv);
    };
  }, []);

  // Gentle crossfade when the hour (and quote) changes — not on first mount.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!motionOK() || !quoteRef.current) return;
    gsap.fromTo(
      quoteRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
    );
  }, [hour ]);

  useEffect(() => {
    if (!motionOK()) return;
    let alive = true;
    const ctx = gsap.context(() => {
      gsap.to(".foot-cat", { scaleY: 1.05, scaleX: 0.99, transformOrigin: "50% 100%", duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".foot-leaf", { rotation: 7, transformOrigin: "50% 100%", duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".foot-badge", { y: -3, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(".foot-glow", { opacity: 0.35 }, { opacity: 0.65, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // sleepy "z" drifting off the cat
      const z = () => {
        if (!alive) return;
        const el = document.createElement("span");
        el.textContent = "z";
        Object.assign(el.style, { position: "absolute", left: "1462px", top: "936px", fontSize: "12px", color: "#c5cbe6", fontFamily: "var(--font-pixel)" });
        root.current?.appendChild(el);
        gsap.fromTo(el, { y: 0, x: 0, opacity: 0, scale: 0.7 }, { y: -22, x: 10, opacity: 1, scale: 1.3, duration: 2.4, ease: "sine.out", onComplete: () => el.remove() });
        gsap.to(el, { opacity: 0, duration: 0.8, delay: 1.6 });
        gsap.delayedCall(rand(1.6, 2.6), z);
      };
      gsap.delayedCall(2, z);
    }, root);
    return () => {
      alive = false;
      ctx.revert();
    };
  }, []);

  const quote = QUOTES[hour % QUOTES.length];
  const hourLabel = `${String(hour).padStart(2, "0")}:00`;

  return (
    <div ref={root} data-intro="footer" className="absolute inset-0 pointer-events-none">
      <svg width="1536" height="1024" viewBox="0 0 1536 1024" className="absolute inset-0">
        <defs>
          <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2635" />
            <stop offset="1" stopColor="#141c2a" />
          </linearGradient>
        </defs>
        <path
          data-testid="footer-bar"
          d="M54 925 H372 Q386 925 390 938 L396 952 Q400 965 414 965 H1000 Q1014 965 1018 952 L1022 936 Q1026 922 1040 922 H1500 Q1515 922 1515 937 V1000 Q1515 1015 1500 1015 H54 Q40 1015 40 1000 V939 Q40 925 54 925 Z"
          fill="url(#bar)"
          stroke="rgba(140,155,200,0.22)"
          strokeWidth="2"
        />
      </svg>

      {/* Warm lamplight glow behind the quote */}
      <div
        className="foot-glow absolute"
        style={{
          left: 990,
          top: 922,
          width: 430,
          height: 96,
          background: "radial-gradient(ellipse at center, rgba(255,196,120,0.14), transparent 70%)",
        }}
      />

      {/* Brand monogram */}
      <div
        className="foot-badge absolute grid place-items-center rounded-full"
        style={{
          left: 30,
          top: 947,
          width: 44,
          height: 44,
          background: "radial-gradient(circle at 35% 30%, #1e2942, #0d1322 75%)",
          border: "1.5px solid rgba(255,209,140,0.45)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 24, color: "#ffd9a0", lineHeight: 1 }}>N</span>
      </div>

      <Image src="/ui/leaf.png" alt="" width={32} height={30} className="foot-leaf absolute" style={{ left: 86, top: 959 }} unoptimized />
      <p
        className="absolute m-0"
        style={{ left: 126, top: 951, fontFamily: SERIF, fontStyle: "italic", fontSize: 13.5, lineHeight: "18px", color: "#c3c9e2" }}
      >
        A curious newsroom<br />for a brighter tomorrow.
      </p>

      {/* Quote of the hour */}
      <p
        data-testid="footer-quote-label"
        className="absolute m-0 text-right"
        style={{ right: 200, top: 938, fontSize: 9.5, letterSpacing: "0.18em", color: "#8b93b8", fontWeight: 500 }}
      >
        QUOTE OF THE HOUR · {hourLabel}
      </p>
      <p
        ref={quoteRef}
        data-testid="footer-quote"
        className="absolute m-0 text-right"
        style={{ right: 200, top: 952, width: 400, fontFamily: SERIF, fontStyle: "italic", fontSize: 15, lineHeight: "20px", color: "#e8ebfa" }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <p className="absolute m-0 text-right text-[10px] text-[#9aa3c6]" style={{ right: 200, top: 994 }}>
        – The AI Newsroom
      </p>
      <Image src="/ui/footer-cat.png" alt="" width={114} height={80} className="foot-cat absolute" style={{ left: 1380, top: 926 }} unoptimized />
    </div>
  );
}
