type ClassValue = string | false | null | undefined | Record<string, boolean>;

/** Join class names, dropping falsy values. */
export function cx(...classes: ClassValue[]): string {
  const out: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (typeof c === "string") {
      if (c) out.push(c);
    } else {
      for (const [k, v] of Object.entries(c)) if (v) out.push(k);
    }
  }
  return out.join(" ");
}

/** "Sep 20, 2026". Empty string when the input is missing/invalid. */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Shorten to `max` chars, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/** "just now" | "3m ago" | "2h ago" | "4d ago". Empty when invalid. */
export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
