"use client";

import { useConnection, type ConnectionState } from "@/lib/connection";
import { cx } from "@/lib/utils";

const PILL: Record<ConnectionState, { label: string; dot: string; title: string }> = {
  live: {
    label: "LIVE",
    dot: "bg-[#4ade80]",
    title: "Connected to the backend",
  },
  degraded: {
    label: "DEGRADED",
    dot: "bg-[#f2b04a]",
    title: "Some backend endpoints are failing — check the dev console",
  },
  offline: {
    label: "OFFLINE",
    dot: "bg-[#f26a6a]",
    title: "Backend unreachable — is it running?",
  },
  demo: {
    label: "DEMO DATA",
    dot: "bg-[#7aa2ff]",
    title: "Demo mode: NEXT_PUBLIC_USE_MOCK=true",
  },
};

/**
 * Small connection-status pill: a text label plus a dot (text, not colour
 * alone). Reads the global connection state from lib/connection.
 */
export default function ConnectionPill({ className }: { className?: string }) {
  const state = useConnection();
  const p = PILL[state];
  return (
    <span
      role="status"
      aria-label={`Backend connection: ${p.label}`}
      title={p.title}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5",
        "text-[10px] font-medium tracking-wide text-[#dfe4ff]",
        className
      )}
    >
      <span className={cx("size-1.5 rounded-full", p.dot)} aria-hidden="true" />
      {p.label}
    </span>
  );
}
