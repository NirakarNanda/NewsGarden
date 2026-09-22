"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAgents } from "@/features/agents/useAgents";
import { runAgentTask, TASK_TYPE_OPTIONS } from "@/features/agents/agentApi";
import { cx } from "@/lib/utils";
import { panelBg, panelClass } from "./EditionProgress";

/**
 * Mission control: assign a specific task to a specific agent.
 * The backend runs it in the background and the campus UI picks
 * the run up via polling — watch the agent flip to "working" and
 * the Live Activity feed for its lifecycle events.
 *
 * Collapsed to a slim 44px bar at the bottom of the right column so
 * it never collides with the footer; expanding opens an overlay that
 * floats above the Activity panel (positioned upward, not downward).
 */
export default function DispatchPanel() {
  const { data: agents, source } = useAgents();
  const [agentId, setAgentId] = useState("");
  const [taskType, setTaskType] = useState(TASK_TYPE_OPTIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

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
    <div
      data-testid="panel-dispatch"
      data-intro="dispatch"
      className="relative w-full"
    >
      <section
        className={`${panelClass} relative w-full`}
        style={{ height: 44, background: panelBg }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="dispatch-overlay"
          className="flex h-full w-full items-center gap-2 px-[18px] text-left"
        >
          <span className="m-0 text-[14px] font-normal leading-5 text-[#e6e9ff]">Dispatch</span>
          <span
            className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide", badge.cls)}
            title={badge.title}
          >
            {badge.label}
          </span>
          <span className="ml-auto text-[#9aa3c6]">
            {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </span>
        </button>
      </section>

      {open && (
        <div
          id="dispatch-overlay"
          role="dialog"
          aria-label="Dispatch a task"
          data-testid="panel-dispatch-overlay"
          className={`${panelClass} absolute left-0 w-full`}
          style={{
            // Overlay opens upward from the collapsed 44px bar: its bottom
            // edge sits exactly on the bar's top edge.
            bottom: 44,
            height: 232,
            background: panelBg,
            zIndex: 40,
          }}
        >
          <div className="flex items-center gap-2 px-[18px] pt-[12px]">
            <h2 className="m-0 text-[14px] font-normal leading-5 text-[#e6e9ff]">Dispatch a task</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dispatch panel"
              className="ml-auto rounded-md px-2 py-1 text-[12px] text-[#9aa3c6] transition hover:bg-white/5 hover:text-[#e6e9ff]"
            >
              Close
            </button>
          </div>

          <div className="flex flex-col gap-1.5 px-[18px] pt-[10px]">
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
        </div>
      )}
    </div>
  );
}
