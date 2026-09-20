import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[#ffd18a] text-[#1a1408] hover:bg-[#ffdf9e]",
  secondary: "bg-white/10 text-[#e6e9ff] hover:bg-white/15 border border-white/10",
  ghost: "text-[#b8c0dc] hover:text-[#e6e9ff] hover:bg-white/5",
  danger: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-400/30",
};

export default function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}
