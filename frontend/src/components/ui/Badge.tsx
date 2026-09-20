import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export type BadgeTone = "default" | "green" | "amber" | "red" | "blue" | "pink";

const TONES: Record<BadgeTone, string> = {
  default: "bg-white/10 text-[#b8c0dc] border-white/10",
  green: "bg-emerald-400/15 text-emerald-300 border-emerald-300/20",
  amber: "bg-amber-400/15 text-amber-300 border-amber-300/20",
  red: "bg-rose-400/15 text-rose-300 border-rose-300/20",
  blue: "bg-sky-400/15 text-sky-300 border-sky-300/20",
  pink: "bg-pink-400/15 text-pink-300 border-pink-300/20",
};

export default function Badge({
  tone = "default",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
