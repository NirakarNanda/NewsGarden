import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export default function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-xl border border-white/10 bg-[#121828]/95 p-4 shadow-lg", className)}>
      {children}
    </div>
  );
}
