import Badge, { type BadgeTone } from "@/components/ui/Badge";

const MAP: Record<string, { tone: BadgeTone; label: string }> = {
  ready_for_approval: { tone: "amber", label: "Awaiting approval" },
  pending: { tone: "amber", label: "Awaiting approval" },
  pending_approval: { tone: "amber", label: "Awaiting approval" },
  approved: { tone: "green", label: "Approved" },
  published: { tone: "blue", label: "Published" },
  revision_requested: { tone: "red", label: "Revision requested" },
  changes_requested: { tone: "red", label: "Revision requested" },
  draft: { tone: "default", label: "Draft" },
  in_progress: { tone: "default", label: "In progress" },
};

export default function ApprovalStatus({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/[\s-]+/g, "_");
  const { tone, label } = MAP[key] ?? { tone: "default" as BadgeTone, label: status || "Unknown" };
  return <Badge tone={tone}>{label}</Badge>;
}
