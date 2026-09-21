"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCcw } from "lucide-react";
import { USE_MOCK, apiGet, apiPost, str, unwrapList } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { normalizeArticle, type Article } from "@/types/article";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ApprovalStatus from "./ApprovalStatus";
import EditionPreview from "./EditionPreview";

interface PendingEdition {
  editionId: string;
  title: string;
  date: string;
  status: string;
  pages: Article[][];
}

function toPages(r: Record<string, unknown>): Article[][] {
  const raw = r.pages ?? r.articles;
  if (!Array.isArray(raw)) return [];
  const norm = (x: unknown) => normalizeArticle(x as Record<string, unknown>);
  if (raw.length > 0 && Array.isArray(raw[0])) {
    return (raw as unknown[][]).map((p) => p.map(norm)).filter((p) => p.length > 0);
  }
  const flat = raw.map((x) => {
    const o = x as Record<string, unknown>;
    const inner = Array.isArray(o.articles) ? o.articles : [x];
    return (inner as unknown[]).map(norm);
  });
  const merged = flat.flat();
  return merged.length > 0 ? [merged] : [];
}

function normalizePending(r: Record<string, unknown>): PendingEdition {
  return {
    editionId: str(r.editionId ?? r.id),
    title: str(r.title, "The Daily NEXA"),
    date: formatDate(str(r.date ?? r.publishedAt ?? r.createdAt)) || "Today",
    status: str(r.status, "ready_for_approval"),
    pages: toPages(r),
  };
}

const MOCK_PENDING: PendingEdition = {
  editionId: "demo",
  title: "The Daily NEXA",
  date: "Today",
  status: "ready_for_approval",
  pages: [
    [
      normalizeArticle({
        articleId: "demo-1",
        title: "Newsroom demo: approval preview",
        source: "NewsGarden",
        category: "Meta",
        status: "ready",
        summary: "This is a mock edition so the approval UI can be reviewed without a backend.",
      }),
    ],
  ],
};

async function fetchPending(): Promise<PendingEdition | null> {
  const rows = unwrapList(await apiGet<unknown>("/api/approval/pending"), "editions");
  if (rows.length === 0) return null;
  return normalizePending(rows[0] as Record<string, unknown>);
}

const APPROVAL_KEY_STORAGE = "newsgarden.approvalKey";

function loadApprovalKey(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(APPROVAL_KEY_STORAGE) ?? "";
}

function authHeaders(key: string): Record<string, string> | undefined {
  return key ? { "x-api-key": key } : undefined;
}

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ready"; edition: PendingEdition }
  | { kind: "done"; edition: PendingEdition; outcome: "approved" | "revised" };

/**
 * Human approval gate (product rule: nothing auto-publishes).
 * Shows the pending edition with Approve / Request revision actions.
 */
export default function ApprovalPanel() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [approvalKey, setApprovalKey] = useState(loadApprovalKey);

  const load = useCallback(async () => {
    if (USE_MOCK) {
      setPhase({ kind: "ready", edition: MOCK_PENDING });
      return;
    }
    setPhase({ kind: "loading" });
    try {
      const pending = await fetchPending();
      setPhase(pending ? { kind: "ready", edition: pending } : { kind: "empty" });
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Failed to load" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveKey = (value: string) => {
    setApprovalKey(value);
    if (typeof window !== "undefined") {
      if (value) window.sessionStorage.setItem(APPROVAL_KEY_STORAGE, value);
      else window.sessionStorage.removeItem(APPROVAL_KEY_STORAGE);
    }
  };

  const act = async (action: "approve" | "revise") => {
    if (phase.kind !== "ready") return;
    setBusy(true);
    setActionError("");
    try {
      if (!USE_MOCK) {
        await apiPost(
          `/api/approval/${phase.edition.editionId}/${action}`,
          action === "revise" ? { note } : undefined,
          { headers: authHeaders(approvalKey) }
        );
      }
      setPhase({
        kind: "done",
        edition: { ...phase.edition, status: action === "approve" ? "approved" : "revision_requested" },
        outcome: action === "approve" ? "approved" : "revised",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed";
      setActionError(
        message.includes("401")
          ? "Unauthorized (401): the backend requires an approval key. Enter it below and try again."
          : message
      );
    } finally {
      setBusy(false);
    }
  };

  if (phase.kind === "loading") {
    return (
      <Card>
        <p className="animate-pulse text-sm text-[#8f97b8]">Checking for editions awaiting approval…</p>
      </Card>
    );
  }

  if (phase.kind === "error") {
    return (
      <Card>
        <p className="text-sm text-rose-300">Couldn&apos;t load the approval queue: {phase.message}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void load()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (phase.kind === "empty") {
    return (
      <Card>
        <p className="text-sm text-[#8f97b8]">No edition is waiting for approval right now.</p>
      </Card>
    );
  }

  if (phase.kind === "done") {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <ApprovalStatus status={phase.edition.status} />
          <p className="text-sm text-[#e6e9ff]">
            {phase.outcome === "approved"
              ? "Edition approved — it can now be published."
              : "Revision requested — the newsroom has your note."}
          </p>
        </div>
        {USE_MOCK && (
          <p className="mt-2 text-xs text-[#8f97b8]">Demo mode: no request was sent.</p>
        )}
        <Button variant="secondary" className="mt-4" onClick={() => void load()}>
          Check again
        </Button>
      </Card>
    );
  }

  const { edition } = phase;
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-[#e6e9ff]">{edition.title}</h2>
              <ApprovalStatus status={edition.status} />
              {USE_MOCK && <Badge tone="blue">Demo</Badge>}
            </div>
            <p className="mt-1 text-sm text-[#8f97b8]">
              {edition.date} · {edition.pages.length} page{edition.pages.length === 1 ? "" : "s"} ·{" "}
              {edition.pages.flat().length} articles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => setShowNote((s) => !s)}>
              <RefreshCcw size={16} />
              Request revision
            </Button>
            <Button disabled={busy} onClick={() => void act("approve")}>
              <Check size={16} />
              {busy ? "Working…" : "Approve"}
            </Button>
          </div>
        </div>

        {showNote && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <label htmlFor="revision-note" className="mb-1.5 block text-sm text-[#b8c0dc]">
              What should the newsroom change?
            </label>
            <textarea
              id="revision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. The lead story needs a stronger headline…"
              className="w-full rounded-lg border border-white/10 bg-[#0b0f1a] p-2.5 text-sm text-[#e6e9ff] placeholder:text-[#8f97b8]/60 focus:border-[#ffd18a]/50 focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="danger" disabled={busy || !note.trim()} onClick={() => void act("revise")}>
                Send revision request
              </Button>
            </div>
          </div>
        )}

        {actionError && <p className="mt-3 text-sm text-rose-300">{actionError}</p>}

        {!USE_MOCK && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <label htmlFor="approval-key" className="mb-1.5 block text-sm text-[#b8c0dc]">
              Approval key
            </label>
            <input
              id="approval-key"
              type="password"
              value={approvalKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder="Only needed if the backend sets API_KEY"
              autoComplete="off"
              className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0b0f1a] p-2.5 text-sm text-[#e6e9ff] placeholder:text-[#8f97b8]/60 focus:border-[#ffd18a]/50 focus:outline-none"
            />
            <p className="mt-1 text-xs text-[#8f97b8]/80">
              Sent as the x-api-key header. Kept in this tab&apos;s session storage only.
            </p>
          </div>
        )}
      </Card>

      <EditionPreview title={edition.title} date={edition.date} pages={edition.pages} />
    </div>
  );
}
