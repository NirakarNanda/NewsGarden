"use client";

import { ListX } from "lucide-react";
import { useAgents } from "@/features/agents/useAgents";
import AgentStatus from "@/components/campus/agents/AgentStatus";

/**
 * Text-only alternative to the sprite-based campus scene.
 *
 * Accessibility fallback for users who can't parse the visual scene:
 * every agent as a plain list row with name, role, text-labelled
 * status, location and current task. Shown when the campus "Text view"
 * toggle is on.
 */
export default function TextAgentList() {
  const { data: agents, source } = useAgents();
  const demo = source === "mock";

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold text-[#f2f4ff]">Agents — text view</h1>
      <p className="mt-1 text-sm text-[#b8c0dc]">
        The newsroom roster as a plain list.
        {demo && " (Demo data — NEXT_PUBLIC_USE_MOCK=true)"}
      </p>

      {source === "error" ? (
        <p className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-5 text-sm text-[#f2a3a3]">
          Couldn&apos;t reach the backend — no agent data available.
        </p>
      ) : agents.length === 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <ListX size={18} className="mt-0.5 shrink-0 text-[#8f97b8]" />
          <div>
            <p className="m-0 text-sm font-medium text-[#e6e9ff]">No agents registered</p>
            <p className="m-0 mt-1 text-sm text-[#8f97b8]">
              The agent registry is empty. Agents appear here once the backend is running.
            </p>
          </div>
        </div>
      ) : (
        <ul className="m-0 mt-6 list-none space-y-2 p-0">
          {agents.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="m-0 text-[15px] font-medium text-[#f2f4ff]">{a.name}</p>
                  <p className="m-0 mt-0.5 text-[13px] text-[#8f97b8]">
                    {a.role} · {a.department}
                  </p>
                </div>
                <AgentStatus status={a.status} />
              </div>
              <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
                <dt className="text-[#8f97b8]">Location</dt>
                <dd className="m-0 text-[#dfe4ff]">{a.location.replace(/-/g, " ")}</dd>
                <dt className="text-[#8f97b8]">Current task</dt>
                <dd className="m-0 text-[#dfe4ff]">
                  {a.currentTaskId ? (
                    <code className="text-[12px]">{a.currentTaskId}</code>
                  ) : (
                    "None"
                  )}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
