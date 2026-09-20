import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export default function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0b0f1a] px-2 py-1 text-[11px] text-[#e6e9ff] opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
