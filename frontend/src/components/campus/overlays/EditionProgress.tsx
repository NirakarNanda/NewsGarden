"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { useEdition } from "@/features/editions/useEdition";
import { useEditionRun } from "@/features/editions/useEditionRun";
import { useInReviewEditions } from "@/features/editions/useInReviewEditions";
import { saveApprovalKey } from "@/lib/approvalKey";
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
  const { data: inReview } = useInReviewEditions();
  const demo = source === "mock";
  const pct = ed && ed.pagesTotal ? Math.min(100, (ed.pagesCompleted / ed.pagesTotal) * 100) : 0;
  const root = useRef<HTMLElement>(null);

  // On-demand edition runs.
  const { runState, starting, startRun } = useEditionRun();
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [runNote, setRunNote] = useState("");

  const busy = starting || runState.running;

  const handleRun = async () => {
    setRunNote("");
    setNeedsKey(false);
    const result = await startRun();
    if (result === "started") setRunNote("Edition run started.");
    else if (result === "running") setRunNote("A run is already in progress.");
    else if (result === "needs-key") setNeedsKey(true);
    else setRunNote("Couldn't start the run.");
  };

  const handleSaveKey = async () => {
    saveApprovalKey(keyInput.trim());
    setKeyInput("");
    setNeedsKey(false);
    const result = await startRun();
    if (result === "started") setRunNote("Edition run started.");
    else if (result === "needs-key") setNeedsKey(true);
    else if (result === "running") setRunNote("A run is already in progress.");
    else setRunNote("Couldn't start the run.");
  };

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
    <section ref={root} data-testid="panel-edition-progress" data-intro="panel" className={panelClass} style={{ left: 1255, top: 12, width: 276, height: 392, background: panelBg }}>
      <CampusHUD />

      {/* In-review banner: surfaces editions waiting for human approval. */}
      {inReview.length > 0 && (
        <Link
          href={`/edition/${inReview[0].editionId}`}
          data-testid="banner-ready-for-approval"
          className="absolute flex items-center justify-between gap-2 rounded-[12px] border border-amber-300/30 bg-amber-400/10 px-3 py-2 transition-colors hover:bg-amber-400/20"
          style={{ left: 15, right: 15, top: 52 }}
        >
          <span>
            <span className="block text-[12px] font-medium text-amber-200">
              Edition ready for approval
            </span>
            <span className="block truncate text-[11px] text-[#b8c0dc]">
              {inReview[0].title}
              {inReview.length > 1 && ` +${inReview.length - 1} more`}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-amber-200">
            Review & approve <ArrowRight size={14} />
          </span>
        </Link>
      )}

      <div className="absolute" style={{ left: 24, top: 90 }}>
        <h2 className="m-0 text-[15px] font-normal leading-5 text-[#dfe4ff]">Today&apos;s Edition</h2>
        {demo && (
          <p className="m-0 mt-1 text-[10px] uppercase tracking-[0.18em] text-[#7aa2ff]">
            Demo data
          </p>
        )}
        {ed?.aiFallback && !demo && (
          <p className="m-0 mt-1 text-[10px] uppercase tracking-[0.18em] text-[#e8b34b]">
            Built without AI
          </p>
        )}
      </div>

      {!demo && (
        <div className="absolute" style={{ right: 16, top: 88 }}>
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={busy}
            title={runState.running ? "An edition run is in progress" : "Build today's edition now"}
            className="grid h-[28px] place-items-center gap-1 rounded-[9px] border border-[#3a4478]/60 bg-[#1d2545] px-2.5 text-[12px] text-[#e6e9ff] hover:bg-[#252f58] disabled:cursor-default disabled:opacity-60"
          >
            <span className="flex items-center gap-1.5">
              <Play size={12} />
              {starting ? "Starting…" : runState.running ? "Running…" : "Run edition"}
            </span>
          </button>
          {runNote && !needsKey && (
            <p className="m-0 mt-1 max-w-[140px] text-right text-[11px] leading-4 text-[#8f97b8]">
              {runNote}
            </p>
          )}
        </div>
      )}

      {needsKey && (
        <div
          className="absolute z-10 rounded-[12px] border border-white/10 bg-[#10162b] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ right: 16, top: 122, width: 220 }}
        >
          <p className="m-0 text-[12px] leading-4 text-[#c9cfe8]">
            The backend requires an approval key.
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Approval key"
            autoComplete="off"
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0f1a] p-2 text-[12px] text-[#e6e9ff] placeholder:text-[#8f97b8]/60 focus:border-[#ffd18a]/50 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNeedsKey(false)}
              className="rounded-lg px-2.5 py-1.5 text-[12px] text-[#8f97b8] hover:text-[#e6e9ff]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSaveKey()}
              disabled={!keyInput.trim()}
              className="rounded-lg border border-[#3a4478]/60 bg-[#1d2545] px-2.5 py-1.5 text-[12px] text-[#e6e9ff] hover:bg-[#252f58] disabled:opacity-60"
            >
              Save &amp; run
            </button>
          </div>
          <p className="m-0 mt-1.5 text-[10px] leading-3 text-[#8f97b8]/80">
            Kept in this tab&apos;s session storage only.
          </p>
        </div>
      )}

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
