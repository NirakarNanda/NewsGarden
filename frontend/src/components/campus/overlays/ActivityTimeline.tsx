"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Bot, FlaskConical, Palette, PenLine, PenTool, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActivity } from "@/features/activity/useActivity";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { cx, timeAgo } from "@/lib/utils";
import { ghostButton, panelBg, panelClass } from "./EditionProgress";

const VISUALS: Record<string, { icon: LucideIcon; color: string }> = {
  "tech-news": { icon: Bot, color: "#5fc8ff" },
  research: { icon: FlaskConical, color: "#5fd4a8" },
  writer: { icon: PenLine, color: "#6fdc8c" },
  illustrator: { icon: Palette, color: "#ffb040" },
  designer: { icon: PenTool, color: "#4aa8ff" },
  "fact-checker": { icon: ShieldCheck, color: "#c8e04a" },
};

const fullDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

export default function ActivityTimeline() {
  const { data, source } = useActivity();
  const live = source === "api";
  const demo = source === "mock";
  // API is newest-first; the timeline reads oldest → newest.
  // The campus panel shows the 4 most recent; the full list lives
  // on /newsroom/activity ("View all").
  const rows = data.slice(0, 4).reverse();
  const listRef = useRef<HTMLOListElement>(null);
  const newest = rows[rows.length - 1]?.id;
  const seen = useRef<string | undefined>(undefined);

  // Icons bob at their own pace.
  useEffect(() => {
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".act-icon").forEach((el) => {
        gsap.to(el, { y: -2.5, duration: rand(1.2, 2), yoyo: true, repeat: -1, ease: "sine.inOut", delay: rand(0, 1) });
      });
    }, listRef);
    return () => ctx.revert();
  }, [newest]);

  useEffect(() => {
    const last = listRef.current?.lastElementChild;
    if (seen.current && seen.current !== newest && last && motionOK()) {
      gsap.from(last, { opacity: 0, x: 14, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(last, { backgroundColor: "rgba(138,210,153,0.22)" }, { backgroundColor: "rgba(138,210,153,0)", duration: 1.6 });
    }
    seen.current = newest;
  }, [newest]);

  const badge = live
    ? { label: "LIVE", cls: "bg-[#4ade80]/15 text-[#4ade80]", title: "Connected to the backend" }
    : demo
      ? {
          label: "DEMO DATA",
          cls: "bg-[#7aa2ff]/15 text-[#7aa2ff]",
          title: "Demo data — NEXT_PUBLIC_USE_MOCK=true",
        }
      : {
          label: "OFFLINE",
          cls: "bg-[#f26a6a]/15 text-[#f26a6a]",
          title: "Backend unreachable — is it running?",
        };

  return (
    <section data-testid="panel-activity-timeline" data-intro="panel" className={`${panelClass} relative w-full`} style={{ height: 330, background: panelBg }}>
      <span className="absolute size-3" style={{ left: 22, top: 27 }}>
        <span className={cx("absolute inset-0 rounded-full", live ? "animate-ping bg-[#4ade80]/60" : demo ? "bg-[#7aa2ff]/60" : "bg-[#f26a6a]/60")} />
        <span className={cx("absolute inset-0 rounded-full", live ? "bg-[#4ade80] shadow-[0_0_8px_#4ade80]" : demo ? "bg-[#7aa2ff]" : "bg-[#5a6285]")} />
      </span>
      <h2 className="absolute text-[16px] font-normal leading-5 text-[#e6e9ff]" style={{ left: 46, top: 22 }}>
        Live Activity
      </h2>
      <span
        className={cx("absolute rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide", badge.cls)}
        style={{ right: 18, top: 24 }}
        title={badge.title}
      >
        {badge.label}
      </span>

      {rows.length === 0 ? (
        <div className="absolute" style={{ left: 18, right: 18, top: 66 }}>
          <p className="m-0 text-[13px] text-[#c9cfe8]">
            {demo ? "No demo activity." : live ? "No activity yet." : "Couldn't reach the backend."}
          </p>
          {!live && !demo && (
            <p className="m-0 mt-1 text-[12px] leading-5 text-[#8f97b8]">
              New activity will appear here once it&apos;s back.
            </p>
          )}
        </div>
      ) : (
      <ol ref={listRef} aria-live="polite" className="absolute m-0 list-none p-0" style={{ left: 18, top: 66 }}>
        {rows.map((r, i) => {
          const v = VISUALS[r.agentId] ?? { icon: Sparkles, color: "#b7bfe0" };
          const Icon = v.icon;
          return (
            <li key={r.id} className="relative flex gap-[13px]" style={{ height: 51.5 }}>
              {i < rows.length - 1 && (
                <span className="absolute w-px bg-[#96a0dc]/25" style={{ left: 12, top: 30, height: 20 }} />
              )}
              <Icon size={24} color={v.color} strokeWidth={1.8} className="act-icon shrink-0" />
              <div className="pl-[4px]">
                <div className="text-[12px] leading-4 text-[#aab2d5]" title={fullDate(r.at)}>
                  {timeAgo(r.at) || "—"}
                </div>
                <div className="text-[12.5px] leading-4 text-[#e6e9ff]" style={{ marginTop: 1 }}>{r.message}</div>
              </div>
            </li>
          );
        })}
      </ol>
      )}

      <Link href="/newsroom/activity" className={ghostButton} style={{ left: 15, top: 284, width: 244, height: 34 }}>
        <span className="flex items-center gap-2">
          View All Activity <ArrowRight size={15} />
        </span>
      </Link>
    </section>
  );
}
