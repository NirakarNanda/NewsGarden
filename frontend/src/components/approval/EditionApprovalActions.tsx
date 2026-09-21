"use client";

import { useState } from "react";
import { Check, Megaphone, RefreshCcw } from "lucide-react";
import { ApiError, USE_MOCK, apiPost } from "@/lib/api";
import { authHeaders, loadApprovalKey, saveApprovalKey } from "@/lib/approvalKey";
import { cx } from "@/lib/utils";

type DoneState = "approved" | "revised" | "published" | null;

/**
 * Approve / Request revision / Publish actions for an edition.
 *
 * Human approval gate (product rule: nothing auto-publishes). Uses the
 * stored approval key (sessionStorage, `x-api-key` header) and reports
 * the backend's real error message with a per-status hint.
 *
 * Publishing is a separate backend endpoint and a separate human click,
 * except for the explicit "Approve & publish" shortcut, which performs
 * the two calls in sequence from one click.
 */
export default function EditionApprovalActions({
  editionId,
  compact = false,
  onStatusChange,
}: {
  editionId: string;
  /** Smaller inline variant for list rows. */
  compact?: boolean;
  /** Called whenever the edition's human-gate state changes. */
  onStatusChange?: (state: Exclude<DoneState, null>) => void;
}) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<DoneState>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const finish = (state: Exclude<DoneState, null>, msg: string) => {
    setDone(state);
    setMessage(msg);
    setShowNote(false);
    setBusyLabel("");
    onStatusChange?.(state);
  };

  /** Human-readable error: the server's message plus a hint per status. */
  const describeError = (e: unknown): string => {
    if (e instanceof ApiError) {
      const server = e.serverMessage;
      switch (e.status) {
        case 401:
          return "The backend requires an approval key — enter it below.";
        case 403:
          return `${server ?? "Not allowed."} The edition must be approved before it can be published.`;
        case 404:
          return "Edition not found — it may have been deleted.";
        case 409:
          return server ?? "Already decided — nothing left to do.";
        case 429:
          return "Rate limited — wait a moment and try again.";
        default:
          return server ?? e.message;
      }
    }
    return e instanceof Error ? e.message : "Action failed.";
  };

  const call = async (
    action: "approve" | "revise" | "publish",
    key: string | null,
  ) => {
    if (USE_MOCK) return;
    await apiPost(
      `/api/approval/${encodeURIComponent(editionId)}/${action}`,
      action === "revise" ? { note } : undefined,
      { headers: authHeaders(key ?? "") },
    );
  };

  const act = async (
    action: "approve" | "revise" | "publish" | "approve-publish",
    keyOverride?: string,
  ) => {
    setBusy(true);
    setMessage("");
    try {
      const key = keyOverride ?? loadApprovalKey();

      if (action === "approve-publish") {
        setBusyLabel("Approving…");
        await call("approve", key);
        setBusyLabel("Publishing…");
        await call("publish", key);
        finish("published", "Approved and published — the newspaper is live.");
        return;
      }

      setBusyLabel(
        action === "publish"
          ? "Publishing…"
          : action === "revise"
            ? "Sending…"
            : "Approving…",
      );
      await call(action, key);

      if (action === "approve") {
        finish("approved", "Approved — publish it when ready.");
      } else if (action === "publish") {
        finish("published", "Published — the newspaper is live.");
      } else {
        finish("revised", "Revision requested — the newsroom has your note.");
      }
    } catch (e) {
      setBusyLabel("");
      if (e instanceof ApiError && e.status === 401) {
        setNeedsKey(true);
      }
      setMessage(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveKey = () => {
    const key = keyInput.trim();
    saveApprovalKey(key);
    setKeyInput("");
    setNeedsKey(false);
    void act(showNote ? "revise" : "approve", key);
  };

  if (done === "revised" || done === "published") {
    return (
      <p
        className={cx(
          "text-sm",
          done === "published" ? "text-emerald-300" : "text-amber-300",
        )}
      >
        {message}{" "}
        {done === "published" && (
          <a
            href={`/edition/${encodeURIComponent(editionId)}`}
            className="underline underline-offset-2 hover:text-emerald-200"
          >
            Open the published edition
          </a>
        )}
      </p>
    );
  }

  return (
    <div className={cx(!compact && "rounded-lg border border-white/10 bg-white/[0.02] p-4")}>
      {done === "approved" ? (
        <div>
          <p className="mb-3 text-sm text-emerald-300">{message}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("publish")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/20 px-3 py-1.5 text-[13px] font-medium text-emerald-200 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Megaphone size={15} />
            {busy ? busyLabel || "Working…" : "Publish now"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("approve")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#4aa8ff]/20 px-3 py-1.5 text-[13px] font-medium text-[#9fd0ff] transition hover:bg-[#4aa8ff]/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={15} />
            {busy ? busyLabel || "Working…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("approve-publish")}
            title="Approve and then publish, in sequence, from this one click"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/15 px-3 py-1.5 text-[13px] font-medium text-emerald-200 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Megaphone size={15} />
            {busy ? busyLabel || "Working…" : "Approve & publish"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowNote((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[13px] text-[#dfe4ff] transition hover:bg-white/5 disabled:opacity-40"
          >
            <RefreshCcw size={15} />
            Request revision
          </button>
        </div>
      )}

      {showNote && !done && (
        <div className="mt-3">
          <label htmlFor={`revision-note-${editionId}`} className="mb-1.5 block text-[13px] text-[#b8c0dc]">
            What should the newsroom change?
          </label>
          <textarea
            id={`revision-note-${editionId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. The lead story needs a stronger headline…"
            className="w-full rounded-lg border border-white/10 bg-[#0b0f1a] p-2 text-[13px] text-[#e6e9ff] placeholder:text-[#8f97b8]/60 focus:border-[#ffd18a]/50 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={busy || !note.trim()}
              onClick={() => void act("revise")}
              className="rounded-lg bg-[#f26a6a]/20 px-3 py-1.5 text-[13px] font-medium text-[#f2a3a3] transition hover:bg-[#f26a6a]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send revision request
            </button>
          </div>
        </div>
      )}

      {needsKey && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <label htmlFor={`approval-key-${editionId}`} className="mb-1.5 block text-[13px] text-[#b8c0dc]">
            Approval key
          </label>
          <div className="flex gap-2">
            <input
              id={`approval-key-${editionId}`}
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Backend API_KEY"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-[#0b0f1a] p-2 text-[13px] text-[#e6e9ff] placeholder:text-[#8f97b8]/60 focus:border-[#ffd18a]/50 focus:outline-none"
            />
            <button
              type="button"
              disabled={!keyInput.trim()}
              onClick={handleSaveKey}
              className="shrink-0 rounded-lg border border-[#3a4478]/60 bg-[#1d2545] px-3 py-1.5 text-[13px] text-[#e6e9ff] hover:bg-[#252f58] disabled:opacity-40"
            >
              Save
            </button>
          </div>
          <p className="mt-1 text-[11px] text-[#8f97b8]/80">
            Kept in this tab&apos;s session storage only.
          </p>
        </div>
      )}

      {message && !done && (
        <p className="mt-2 text-[13px] text-[#f2a3a3]">{message}</p>
      )}
    </div>
  );
}
