"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useEdition } from "@/features/editions/useEdition";
import { EDITION_STAGES } from "@/lib/constants";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import CampusHUD from "./CampusHUD";

export const panelClass =
  "absolute rounded-[18px] border border-white/[0.07] shadow-[0_10px_30px_rgba(0,0,0,0.4)]";
export const panelBg = "linear-gradient(180deg,#171d34 0%,#0f1728 100%)";
export const ghostButton =
  "absolute grid place-items-center rounded-[11px] border border-[#3a4478]/60 bg-[#1d2545] text-[14px] text-[#e6e9ff] hover:bg-[#252f58]";

export default function EditionProgress() {
  const { data: ed, source } = useEdition();
  const demo = source === "mock";
  const pct = ed && ed.pagesTotal ? Math.min(100, (ed.pagesCompleted / ed.pagesTotal) * 100) : 0;
  const root = useRef<HTMLElement>(null);

  // Entrance: bar fills, rows slide in, checks pop, current stage pulses.
  useEffect(() => {
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.from(".bar-fill", { scaleX: 0, transformOrigin: "left center", duration: 1.2, delay: 0.9, ease: "power3.out" });
      gsap.from(".stage-row", { x: -12, opacity: 0, stagger: 0.08, delay: 1, duration: 0.45, ease: "power2.out" });
      gsap.from(".stage-check", { scale: 0, rotation: -90, stagger: 0.14, delay: 1.3, duration: 0.5, ease: "back.out(2.4)" });
      gsap.fromTo(".stage-ring", { scale: 1, opacity: 0.7 }, { scale: 1.9, opacity: 0, duration: 1.4, repeat: -1, ease: "power1.out" });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} data-intro="panel" className={panelClass} style={{ left: 1255, top: 12, width: 276, height: 392, background: panelBg }}>
      <CampusHUD />

      <div className="absolute" style={{ left: 24, top: 90 }}>
        <h2 className="m-0 text-[15px] font-normal leading-5 text-[#dfe4ff]">Today&apos;s Edition</h2>
        {demo && (
          <p className="m-0 mt-1 text-[10px] uppercase tracking-[0.18em] text-[#7aa2ff]">
            Demo data
          </p>
        )}
      </div>

      {!ed ? (
        <div className="absolute" style={{ left: 24, right: 24, top: 126 }}>
          <p className="m-0 text-[13px] leading-5 text-[#c9cfe8]">
            {source === "error" ? "Couldn't reach the backend." : "No edition in production yet."}
          </p>
          {source === "error" && (
            <p className="m-0 mt-1 text-[12px] leading-5 text-[#8f97b8]">
              Progress will appear here once it&apos;s back.
            </p>
          )}
        </div>
      ) : (
        <>
      <div className="absolute overflow-hidden rounded-full bg-[#2b3350]" style={{ left: 24, top: 120, width: 145, height: 9 }}>
        <div className="bar-fill h-full rounded-full bg-[#8ad299] transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="absolute text-right text-[12px] text-[#c9cfe8]" style={{ right: 31, top: 116 }}>
        {ed.pagesCompleted} / {ed.pagesTotal} pages
      </span>

      <ol className="absolute m-0 list-none p-0" style={{ left: 24, top: 146 }}>
        {EDITION_STAGES.map((label, i) => {
          const done = i < ed.currentStage;
          return (
            <li key={label} className="stage-row flex items-center gap-[19px]" style={{ height: 32 }}>
              {done ? (
                <span className="stage-check grid size-5 place-items-center rounded-full bg-[#e3e8ff] text-[#141b33]">
                  <Check size={13} strokeWidth={3.5} />
                </span>
              ) : (
                <span className="relative grid size-5 place-items-center rounded-full border-[1.5px] border-[#7f88b5] text-[12px] text-[#b7bfe0]">
                  {i === ed.currentStage && <span className="stage-ring absolute inset-[-1.5px] rounded-full border border-[#8ad299]" />}
                  {i + 1}
                </span>
              )}
              <span className="text-[13.5px] text-[#dbe0f5]">{label}</span>
            </li>
          );
        })}
      </ol>

      <Link href={`/edition/${ed.editionId}`} className={ghostButton} style={{ left: 15, top: 346, width: 244, height: 32 }}>
        <span className="flex items-center gap-2">
          View Edition <ArrowRight size={15} />
        </span>
      </Link>
        </>
      )}
    </section>
  );
}
