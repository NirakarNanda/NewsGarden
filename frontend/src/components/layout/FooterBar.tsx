"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { useInReviewEditions } from "@/features/editions/useInReviewEditions";
import { useEditionRun } from "@/features/editions/useEditionRun";

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

/** Live clock — ticks every second. Mount-gated so the server render and the
 *  first client render match exactly (no hydration mismatch). */
function FooterClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="absolute" style={{ left: 372, top: 912 }}>
      <p className="m-0 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8b93b8]">
        Local time
      </p>
      <p className="m-0 mt-0.5 tabular-nums text-[24px] font-semibold leading-none text-[#eef1ff]">
        {now ? `${p(now.getHours())}:${p(now.getMinutes())}` : "--:--"}
        <span className="text-[15px] font-medium text-[#8b93b8]">:{now ? p(now.getSeconds()) : "--"}</span>
      </p>
    </div>
  );
}

/** Live newsroom status pill: run in progress, editions awaiting approval, or idle. */
function EditionStatusPill() {
  const { data: inReview } = useInReviewEditions();
  const { runState } = useEditionRun();

  const inner = runState.running ? (
    <>
      <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
      <span className="text-sky-200">Edition run in progress…</span>
    </>
  ) : inReview.length > 0 ? (
    <>
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
      </span>
      <span className="text-amber-200">
        {inReview.length} edition{inReview.length === 1 ? "" : "s"} awaiting approval
      </span>
    </>
  ) : (
    <>
      <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
      <span className="text-[#a9b4d8]">Newsroom idle</span>
    </>
  );

  const cls =
    "pointer-events-auto absolute flex max-w-[220px] items-center gap-2 truncate rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium backdrop-blur-sm transition-colors";
  const style = { left: 540, top: 924 } as const;

  if (!runState.running && inReview.length > 0) {
    return (
      <Link
        href="/newsroom/editions"
        data-testid="footer-edition-status"
        className={`${cls} hover:border-amber-300/40 hover:bg-amber-400/10`}
        style={style}
        title="Review editions awaiting approval"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div data-testid="footer-edition-status" className={cls} style={style}>
      {inner}
    </div>
  );
}

export default function FooterBar() {
  const root = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const catWrap = useRef<HTMLDivElement>(null);
  const [hour, setHour] = useState<number | null>(null);
  const firstRender = useRef(true);

  // Flip the quote exactly on the hour, then every hour after.
  // Mount-gated: the first render uses a fixed fallback hour so the server
  // HTML and the first client render match exactly (no hydration mismatch).
  useEffect(() => {
    setHour(currentHour());
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
  }, [hour]);

  // The footer cat wakes up and cheers when an edition ships.
  useEffect(() => {
    const el = catWrap.current;
    if (!el) return;
    const cheer = () => {
      if (!motionOK()) return;
      gsap.fromTo(el, { y: 0 }, { y: -16, duration: 0.28, yoyo: true, repeat: 3, ease: "power2.out" });
    };
    window.addEventListener("campus:celebrate", cheer);
    return () => window.removeEventListener("campus:celebrate", cheer);
  }, []);

  useEffect(() => {
    if (!motionOK()) return;
    let alive = true;
    const ctx = gsap.context(() => {
      gsap.to(".foot-cat", { scaleY: 1.05, scaleX: 0.99, transformOrigin: "50% 100%", duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".foot-badge", { y: -3, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(".foot-glow", { opacity: 0.35 }, { opacity: 0.65, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // Occasional ear twitch on the footer cat.
      const twitch = () => {
        if (!alive) return;
        gsap.fromTo(".foot-cat", { rotation: 0 }, { rotation: 2.5, duration: 0.09, yoyo: true, repeat: 3, ease: "sine.inOut" });
        gsap.delayedCall(rand(4, 9), twitch);
      };
      gsap.delayedCall(3, twitch);
      // sleepy "z" drifting off the cat
      const z = () => {
        if (!alive) return;
        const el = document.createElement("span");
        el.textContent = "z";
        Object.assign(el.style, { position: "absolute", left: "1462px", top: "910px", fontSize: "12px", color: "#c5cbe6", fontFamily: "var(--font-pixel)" });
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

  const displayHour = hour ?? 12;
  const quote = QUOTES[displayHour % QUOTES.length];
  const hourLabel = `${String(displayHour).padStart(2, "0")}:00`;

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
          d="M54 901 H372 Q386 901 390 914 L396 928 Q400 941 414 941 H1000 Q1014 941 1018 928 L1022 912 Q1026 898 1040 898 H1500 Q1515 898 1515 913 V1000 Q1515 1015 1500 1015 H54 Q40 1015 40 1000 V915 Q40 901 54 901 Z"
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
          top: 898,
          width: 430,
          height: 110,
          background: "radial-gradient(ellipse at center, rgba(255,196,120,0.14), transparent 70%)",
        }}
      />

      {/* Brand monogram */}
      <div
        className="foot-badge absolute grid place-items-center rounded-full"
        style={{
          left: 28,
          top: 921,
          width: 52,
          height: 52,
          background: "radial-gradient(circle at 35% 30%, #1e2942, #0d1322 75%)",
          border: "1.5px solid rgba(255,209,140,0.45)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 28, color: "#ffd9a0", lineHeight: 1 }}>N</span>
      </div>

      <Image src="/ui/leaf.png" alt="" width={36} height={34} className="foot-leaf absolute" style={{ left: 92, top: 933 }} unoptimized />
      <p
        className="absolute m-0"
        style={{ left: 136, top: 924, fontFamily: SERIF, fontStyle: "italic", fontSize: 15.5, lineHeight: "21px", color: "#c3c9e2" }}
      >
        A curious newsroom<br />for a brighter tomorrow.
      </p>

      <FooterClock />
      <EditionStatusPill />

      {/* Quote of the hour */}
      <p
        data-testid="footer-quote-label"
        className="absolute m-0 text-right"
        style={{ right: 200, top: 910, fontSize: 13, letterSpacing: "0.18em", color: "#8b93b8", fontWeight: 500 }}
      >
        QUOTE OF THE HOUR · {hourLabel}
      </p>
      <p
        ref={quoteRef}
        data-testid="footer-quote"
        className="absolute m-0 text-right"
        style={{ right: 200, top: 930, width: 420, fontFamily: SERIF, fontStyle: "italic", fontSize: 19, lineHeight: "25px", color: "#e8ebfa" }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <p className="absolute m-0 text-right text-[13px] text-[#9aa3c6]" style={{ right: 200, top: 986 }}>
        – The AI Newsroom
      </p>
      <div ref={catWrap} className="absolute" style={{ left: 1380, top: 900 }}>
        <Image src="/ui/footer-cat.png" alt="" width={122} height={86} className="foot-cat block" unoptimized />
      </div>
    </div>
  );
}
