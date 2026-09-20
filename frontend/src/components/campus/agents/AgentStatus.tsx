import type { AgentStatus as Status } from "@/types/agent";
import { cx } from "@/lib/utils";

const MAP: Record<Status, { dot: string; label: string }> = {
  working: { dot: "bg-emerald-400", label: "Working" },
  walking: { dot: "bg-sky-400", label: "Walking" },
  idle: { dot: "bg-[#8f97b8]", label: "Idle" },
  waiting: { dot: "bg-amber-400", label: "Waiting" },
  completed: { dot: "bg-emerald-300", label: "Done" },
  error: { dot: "bg-rose-400", label: "Error" },
};

export default function AgentStatus({ status, className }: { status: Status; className?: string }) {
  const { dot, label } = MAP[status] ?? MAP.idle;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b0f1a]/85 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#b8c0dc]",
        className,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", dot, status === "working" && "animate-pulse")} />
      {label}
    </span>
  );
}
