"use client";

import { useState } from "react";
import { useNewsEvents } from "@/lib/socket";
import { cx } from "@/lib/utils";
import type { EditionSummary } from "@/types/edition";
import Card from "@/components/ui/Card";

type StageState = "done" | "active" | "todo" | "attention";

interface Stage {
  key: string;
  label: string;
}

const STAGES: Stage[] = [
  { key: "discovery", label: "Discovery" },
  { key: "editorial", label: "Editorial" },
  { key: "visual", label: "Visual" },
  { key: "design", label: "Design" },
  { key: "quality", label: "Quality" },
  { key: "approval", label: "Approval" },
];

/**
 * Edition pipeline board: discovery → editorial → visual → design →
 * quality → approval. Base position comes from the edition's currentStage
 * (positional mapping); live backend events refine it in real time.
 */
export default function ProductionBoard({ edition }: { edition: EditionSummary | null }) {
  const [live, setLive] = useState<Record<string, StageState>>({});

  useNewsEvents((e) => {
    switch (e.type) {
      case "EDITION_STAGE_COMPLETED":
        // The stage named in the event (or the current active one) is done.
        setLive((s) => {
          const next = { ...s };
          const idx = STAGES.findIndex((st) => st.key === (e.message ?? "").toLowerCase());
          const doneIdx = idx >= 0 ? idx : STAGES.findIndex((st) => (s[st.key] ?? "todo") === "active");
          if (doneIdx >= 0) {
            next[STAGES[doneIdx].key] = "done";
            if (doneIdx + 1 < STAGES.length) next[STAGES[doneIdx + 1].key] = "active";
          }
          return next;
        });
        break;
      case "AGENT_TASK_FAILED":
        setLive((s) => {
          const next = { ...s };
          const idx = STAGES.findIndex((st) => (s[st.key] ?? "todo") === "active");
          if (idx >= 0) next[STAGES[idx].key] = "attention";
          return next;
        });
        break;
      case "EDITION_READY_FOR_APPROVAL":
        setLive((s) => ({ ...s, approval: "active" }));
        break;
      case "EDITION_APPROVED":
      case "EDITION_PUBLISHED":
        setLive(Object.fromEntries(STAGES.map((st) => [st.key, "done"])));
        break;
      case "EDITION_REVISION_REQUESTED":
        setLive((s) => ({ ...s, editorial: "active", approval: "todo" }));
        break;
      default:
        break;
    }
  });

  const stateFor = (i: number): StageState => {
    const key = STAGES[i].key;
    if (live[key]) return live[key];
    if (!edition) return "todo";
    if (i < edition.currentStage) return "done";
    if (i === edition.currentStage) return "active";
    return "todo";
  };

  const dot: Record<StageState, string> = {
    done: "bg-emerald-400",
    active: "bg-[#ffd18a] animate-pulse",
    todo: "bg-white/15",
    attention: "bg-rose-400 animate-pulse",
  };

  return (
    <Card className="w-64">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f97b8]">Production</p>
      {!edition && Object.keys(live).length === 0 ? (
        <p className="mt-2 text-sm text-[#8f97b8]">No edition in production yet.</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {STAGES.map((st, i) => {
            const state = stateFor(i);
            return (
              <li key={st.key} className="flex items-center gap-2.5">
                <span className={cx("h-2.5 w-2.5 shrink-0 rounded-full", dot[state])} />
                <span
                  className={cx(
                    "text-sm",
                    state === "todo" ? "text-[#8f97b8]" : "text-[#e6e9ff]",
                    state === "active" && "font-medium",
                  )}
                >
                  {st.label}
                </span>
                {state === "attention" && (
                  <span className="text-[10px] uppercase tracking-widest text-rose-300">needs help</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {edition && (
        <p className="mt-3 border-t border-white/10 pt-2 text-xs text-[#8f97b8]">
          {edition.pagesCompleted}/{edition.pagesTotal} pages
        </p>
      )}
    </Card>
  );
}
