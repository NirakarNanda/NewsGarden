import type { AgentInfo } from "@/types/agent";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import AgentStatus from "@/components/campus/agents/AgentStatus";

const TASK_TONE: Record<string, "default" | "blue" | "green" | "red" | "amber"> = {
  working: "blue",
  walking: "blue",
  waiting: "amber",
  idle: "default",
  completed: "green",
  error: "red",
};

const TASK_LABEL: Record<string, string> = {
  working: "Running",
  walking: "Running",
  waiting: "Pending",
  idle: "Pending",
  completed: "Completed",
  error: "Failed",
};

/**
 * Shows the selected agent's current task, sourced from the /api/agents
 * record the parent already fetched (no extra requests).
 */
export default function CurrentTask({ agent }: { agent: AgentInfo | null }) {
  if (!agent) {
    return (
      <Card>
        <p className="text-sm text-[#8f97b8]">Select an agent to see what they&apos;re working on.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f97b8]">Current task</p>
          <h3 className="mt-1 font-medium text-[#e6e9ff]">{agent.name}</h3>
          <p className="text-xs text-[#8f97b8]">
            {agent.role} · {agent.department}
          </p>
        </div>
        <AgentStatus status={agent.status} />
      </div>

      {agent.currentTaskId ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <code className="truncate text-xs text-[#b8c0dc]">{agent.currentTaskId}</code>
            <Badge tone={TASK_TONE[agent.status] ?? "default"}>{TASK_LABEL[agent.status] ?? agent.status}</Badge>
          </div>
        </div>
      ) : (
        <p className="mt-3 border-t border-white/10 pt-3 text-sm text-[#8f97b8]">
          No active task{agent.status === "idle" ? " — taking a break" : ""}.
        </p>
      )}
    </Card>
  );
}
