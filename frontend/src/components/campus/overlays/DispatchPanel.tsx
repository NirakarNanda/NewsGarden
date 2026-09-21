"use client";

import { useState } from "react";
import { useAgents } from "@/features/agents/useAgents";
import { runAgentTask, TASK_TYPE_OPTIONS } from "@/features/agents/agentApi";
import { cx } from "@/lib/utils";
import { panelBg, panelClass } from "./EditionProgress";

/**
 * Mission control: assign a specific task to a specific agent.
 * The backend runs it in the background and the campus UI picks
 * the run up via polling — watch the agent flip to "working" and
 * the Live Activity feed for its lifecycle events.
 */
export default function DispatchPanel() {
  const { data: agents, source } = useAgents();
  const [agentId, setAgentId] = useState("");
  const [taskType, setTaskType] = useState(TASK_TYPE_OPTIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const live = source === "api";
  const demo = source === "mock";
  const offline = source === "error";
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

  const dispatch = async () => {
    if (!agentId || busy) return;
    setBusy(true);
    setNote("");
    try {
      const res = await runAgentTask(agentId, taskType);
      setNote(`Task ${res.taskId.slice(0, 8)} dispatched`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setBusy(false);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-white/10 bg-[#0f1626] px-2 py-1.5 text-[12px] text-[#dfe4ff] outline-none focus:border-[#4aa8ff]/60";

  return (
    <section
      data-intro="dispatch"
      className={panelClass}
      style={{ left: 1255, top: 846, width: 276, height: 150, background: panelBg }}
    >
      <div className="absolute flex items-center gap-2" style={{ left: 18, top: 12, right: 18 }}>
        <h2 className="m-0 text-[14px] font-normal leading-5 text-[#e6e9ff]">Dispatch</h2>
        <span
          className={cx("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide", badge.cls)}
          title={badge.title}
        >
          {badge.label}
        </span>
      </div>

      <div className="absolute flex flex-col gap-1.5" style={{ left: 18, top: 38, right: 18 }}>
        {offline && (
          <p className="m-0 text-[11px] leading-4 text-[#f2a3a3]">
            Backend offline — dispatch unavailable.
          </p>
        )}
        <select
          aria-label="Agent"
          className={selectClass}
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
        >
          <option value="">Pick an agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.status}
            </option>
          ))}
        </select>
        <select
          aria-label="Task type"
          className={selectClass}
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
        >
          {TASK_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={dispatch}
          disabled={!agentId || busy || !live}
          className="rounded-lg bg-[#4aa8ff]/20 px-2 py-1.5 text-[12px] font-medium text-[#9fd0ff] transition hover:bg-[#4aa8ff]/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Dispatching…" : "Assign task"}
        </button>
        {note && <p className="m-0 truncate text-[10.5px] text-[#9aa3c6]">{note}</p>}
      </div>
    </section>
  );
}
