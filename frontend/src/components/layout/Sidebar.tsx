"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileText,
  Home,
  Play,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { useInReviewEditions } from "@/features/editions/useInReviewEditions";
import { useEditionRun } from "@/features/editions/useEditionRun";

const NAV = [
  { label: "Office", href: "/", icon: Home, active: true },
  { label: "Agents", href: "/newsroom/agents", icon: Users },
  { label: "Editions", href: "/newsroom/editions", icon: FileText },
  { label: "Library", href: "/newsroom", icon: BookOpen },
  { label: "Analytics", href: "/newsroom/activity", icon: BarChart3 },
  { label: "Settings", href: "/newsroom", icon: Settings },
];

/** Live local clock for the sidebar header. Ticks once a second. */
function SideClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <span className="tabular-nums text-[13px] font-medium tracking-wide text-[#9fb4e8]">
      {hh}:{mm}
      <span className="text-[#5f6b94]">:{ss}</span>
    </span>
  );
}

/**
 * Left rail — 276px, matching the right column, so the office building sits
 * exactly centred in the free space between the two side rails.
 *
 * Now a flex column: brand + live clock, bigger nav, an "awaiting approval"
 * quick-jump card, run quick-actions, and the (blinking) cat.
 */
export default function Sidebar() {
  const root = useRef<HTMLElement>(null);
  const { data: inReview } = useInReviewEditions();
  const inReviewCount = inReview.length;
  const { runState, starting, startRun } = useEditionRun();
  const [runNote, setRunNote] = useState<string | null>(null);
  const busy = starting || runState.running;

  useEffect(() => {
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.to(".side-moon", { y: -2.5, rotation: 4, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(".side-glow", { opacity: 0.25, scale: 0.9 }, { opacity: 0.7, scale: 1.15, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // Breathing on the wrapper, blinking on the image itself — they compose.
      gsap.to(".side-cat", { scaleY: 1.06, scaleX: 0.99, transformOrigin: "50% 100%", duration: 1.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
      let alive = true;
      const blink = () => {
        if (!alive) return;
        gsap.fromTo(
          ".side-cat-blink",
          { scaleY: 1 },
          { scaleY: 0.8, transformOrigin: "50% 35%", duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" },
        );
        gsap.delayedCall(rand(2.6, 5.2), blink);
      };
      gsap.delayedCall(1.8, blink);
      gsap.from(".nav-item", { x: -24, opacity: 0, stagger: 0.07, delay: 0.5, duration: 0.5, ease: "power3.out" });
      gsap.from(".side-card", { x: -18, opacity: 0, stagger: 0.1, delay: 0.9, duration: 0.5, ease: "power2.out" });
      return () => {
        alive = false;
      };
    }, root);
    return () => ctx.revert();
  }, []);

  const wiggle = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector("svg");
    if (icon && motionOK())
      gsap.fromTo(icon, { rotation: -14, scale: 0.85 }, { rotation: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  };

  const catHop = () => {
    if (motionOK())
      gsap.fromTo(".side-cat", { y: 0 }, { y: -10, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
  };

  const handleRun = async (quick: boolean) => {
    setRunNote(null);
    const result = await startRun(quick ? { mode: "quick" } : undefined);
    const editionId =
      typeof result === "object" && result !== null
        ? (result as { editionId?: string }).editionId
        : undefined;
    if (result === "started" || editionId) {
      if (editionId && typeof window !== "undefined") {
        window.location.href = `/edition/${editionId}/live`;
        return;
      }
      setRunNote("Edition run started.");
    } else if (result === "running") setRunNote("A run is already in progress.");
    else if (result === "needs-key") setRunNote("Needs an approval key — add it from the Edition panel.");
    else setRunNote("Couldn't start the run.");
  };

  return (
    <aside
      ref={root}
      data-testid="sidebar"
      data-intro="sidebar"
      className="absolute flex flex-col border-r border-white/5 shadow-[4px_0_18px_rgba(0,0,0,0.35)]"
      style={{
        left: 0,
        top: 0,
        width: 276,
        height: 888,
        borderRadius: "0 0 22px 0",
        background: "linear-gradient(180deg, #151c31 0%, #101627 55%, #0c1222 100%)",
      }}
    >
      {/* Brand */}
      <div className="relative px-7 pt-5">
        <span className="side-glow absolute rounded-full" style={{ left: 22, top: 20, width: 54, height: 48, background: "radial-gradient(circle, rgba(255,214,110,0.55), transparent 70%)" }} />
        <Image src="/ui/logo-moon.png" alt="" width={50} height={54} className="side-moon absolute" style={{ left: 26, top: 18 }} unoptimized />
        <div className="text-[14px] leading-none text-[#dfe4ff]" style={{ marginLeft: 64 }}>
          The Daily
        </div>
        <div className="mt-1 text-[26px] font-normal leading-none tracking-[0.08em] text-[#f2f4ff]" style={{ marginLeft: 64 }}>
          NewsGarden
        </div>
        <div className="mt-2.5 flex items-center gap-2" style={{ marginLeft: 64 }}>
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <SideClock />
        </div>
      </div>

      {/* Nav */}
      <div className="mt-5 px-4">
        <p className="m-0 px-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8f97b8]">
          Workspace
        </p>
        <nav className="mt-2 flex flex-col" style={{ gap: 5 }}>
          {NAV.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              onMouseEnter={wiggle}
              className={`nav-item relative flex items-center rounded-2xl text-[17px] transition-colors ${
                active
                  ? "bg-[#232c52] text-[#f2f4ff] shadow-[inset_0_0_0_1px_rgba(122,162,255,0.18)]"
                  : "text-[#b8c0dc] hover:bg-white/5 hover:text-[#e8ecff]"
              }`}
              style={{ height: 48, paddingLeft: 16, paddingRight: 14, gap: 15 }}
            >
              <Icon size={23} fill={active || label === "Agents" || label === "Settings" ? "currentColor" : "none"} strokeWidth={active ? 1.5 : 1.8} />
              {label}
              {label === "Editions" && inReviewCount > 0 && (
                <span
                  data-testid="sidebar-editions-badge"
                  title={`${inReviewCount} edition${inReviewCount === 1 ? "" : "s"} waiting for approval`}
                  className="absolute right-3 grid min-w-[26px] place-items-center rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[12px] font-semibold leading-none text-[#1a1206]"
                >
                  {inReviewCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Awaiting approval — quick-jump card */}
      {inReviewCount > 0 && (
        <div className="side-card mt-4 px-4">
          <div
            data-testid="sidebar-approval-card"
            className="rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] p-3"
          >
            <p className="m-0 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">
              <Zap size={13} /> Awaiting approval
            </p>
            <ul className="m-0 mt-2 list-none p-0" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {inReview.slice(0, 2).map((e) => (
                <li key={e.editionId}>
                  <Link
                    href={`/edition/${e.editionId}`}
                    className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-amber-300/10"
                    title={e.title}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" aria-hidden />
                    <span className="truncate text-[14px] text-[#f0e8d2]">{e.title}</span>
                    <ChevronRight size={14} className="ml-auto shrink-0 text-amber-200/60 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/newsroom/editions"
              className="mt-1.5 flex items-center gap-1 px-2 text-[13px] font-medium text-amber-200/80 transition-colors hover:text-amber-100"
            >
              {inReviewCount > 2 ? `+${inReviewCount - 2} more — review all` : "Review now"} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="side-card mt-4 px-4">
        <p className="m-0 px-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#8f97b8]">
          Newsroom
        </p>
        <div className="mt-2 flex items-center gap-2 px-3">
          <span
            className={`h-2 w-2 rounded-full ${busy ? "animate-pulse bg-sky-400" : "bg-emerald-400"}`}
            aria-hidden
          />
          <span className="text-[13px] text-[#9fb0d8]">
            {busy ? "Edition run in progress…" : "Newsroom idle — ready to print"}
          </span>
        </div>
        <div className="mt-2.5 flex gap-2 px-1">
          <button
            type="button"
            onClick={() => void handleRun(false)}
            disabled={busy}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2b3a6e] text-[14px] font-medium text-[#eef1ff] shadow-[inset_0_0_0_1px_rgba(122,162,255,0.25)] transition hover:bg-[#34457f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={15} /> New run
          </button>
          <button
            type="button"
            onClick={() => void handleRun(true)}
            disabled={busy}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[14px] font-medium text-[#cfd5ee] transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap size={15} /> Quick run
          </button>
        </div>
        {runNote && (
          <p className="m-0 mt-2 px-3 text-[12.5px] leading-snug text-[#9fb0d8]">{runNote}</p>
        )}
      </div>

      {/* Footer: divider, cat, tagline, version */}
      <div className="mt-auto px-6 pb-5">
        <div className="mb-3 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
        <div className="flex items-end justify-center gap-3">
          <div className="side-cat" onMouseEnter={catHop} title="The newsroom cat approves">
            <Image src="/ui/sidebar-cat.png" alt="" width={92} height={49} className="side-cat-blink block" unoptimized />
          </div>
        </div>
        <p className="m-0 mt-2 text-center text-[15px] leading-[20px] text-[#cfd5ee]">
          Good Ideas,<br />Better Tomorrows
        </p>
        <p className="m-0 mt-1.5 text-center text-[12px] text-[#8f97b8]">v0.1.0</p>
      </div>
    </aside>
  );
}
