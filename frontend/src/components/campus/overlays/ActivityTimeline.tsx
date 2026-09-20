"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Bot, FlaskConical, Palette, PenLine, PenTool, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActivity } from "@/features/activity/useActivity";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";
import { ghostButton, panelBg, panelClass } from "./EditionProgress";

const VISUALS: Record<string, { icon: LucideIcon; color: string }> = {
  "tech-news": { icon: Bot, color: "#5fc8ff" },
  research: { icon: FlaskConical, color: "#5fd4a8" },
  writer: { icon: PenLine, color: "#6fdc8c" },
  illustrator: { icon: Palette, color: "#ffb040" },
  designer: { icon: PenTool, color: "#4aa8ff" },
  "fact-checker": { icon: ShieldCheck, color: "#c8e04a" },
};

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export default function ActivityTimeline() {
  const { data } = useActivity();
  // API is newest-first; the timeline reads oldest → newest.
  const rows = data.slice(0, 6).reverse();
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

  return (
    <section data-intro="panel" className={panelClass} style={{ left: 1255, top: 418, width: 276, height: 418, background: panelBg }}>
      <span className="absolute size-3" style={{ left: 22, top: 27 }}>
        <span className="absolute inset-0 animate-ping rounded-full bg-[#4ade80]/60" />
        <span className="absolute inset-0 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
      </span>
      <h2 className="absolute text-[16px] font-normal leading-5 text-[#e6e9ff]" style={{ left: 46, top: 22 }}>
        Live Activity
      </h2>

      <ol ref={listRef} className="absolute m-0 list-none p-0" style={{ left: 18, top: 66 }}>
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
                <div className="text-[12px] leading-4 text-[#aab2d5]">{hhmm(r.at)}</div>
                <div className="text-[12.5px] leading-4 text-[#e6e9ff]" style={{ marginTop: 1 }}>{r.message}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <Link href="/newsroom/activity" className={ghostButton} style={{ left: 15, top: 370, width: 244, height: 34 }}>
        <span className="flex items-center gap-2">
          View All Activity <ArrowRight size={15} />
        </span>
      </Link>
    </section>
  );
}
