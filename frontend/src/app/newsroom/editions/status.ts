import type { BadgeTone } from "@/components/ui/Badge";

/** Status → badge tone, with text labels (never colour alone). */
export function editionTone(status: string): BadgeTone {
  switch (status) {
    case "published":
      return "green";
    case "approved":
      return "blue";
    case "compiled":
      return "green";
    case "in-review":
      return "amber";
    case "revision-requested":
      return "red";
    case "failed":
      return "red";
    case "in-progress":
      return "pink";
    default:
      return "default";
  }
}

/** "in-review" → "In review". */
export function prettyStatus(status: string): string {
  if (!status) return "Unknown";
  return status
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
