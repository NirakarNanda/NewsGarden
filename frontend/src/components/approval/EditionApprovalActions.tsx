"use client";

import { useState } from "react";
import { Check, RefreshCcw } from "lucide-react";
import { ApiError, USE_MOCK, apiPost } from "@/lib/api";
import { authHeaders, loadApprovalKey, saveApprovalKey } from "@/lib/approvalKey";
import { cx } from "@/lib/utils";

/**
 * Approve / Request revision actions for an in-review edition.
 *
 * Human approval gate (product rule: nothing auto-publishes). Uses the
 * stored approval key (sessionStorage, `x-api-key` header) and reports
 * 401/409 from the backend honestly. Rendered on the newsroom editions
 * list and the edition page for editions with status `in-review`.
 */
export default function EditionApprovalActions({
  editionId,
  compact = false,
}: {
  editionId: string;
  /** Smaller inline variant for list rows. */
  compact?: boolean;
}) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<"approved" | "revised" | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const act = async (action: "approve" | "revise", keyOverride?: string) => {
    setBusy(true);
    setMessage("");
    try {
      const key = keyOverride ?? loadApprovalKey();
      if (!USE_MOCK) {
        await apiPost(
          `/api/approval/${encodeURIComponent(editionId)}/${action}`,
          action === "revise" ? { note } : undefined,
          { headers: authHeaders(key) },
        );
      }
      setDone(action === "approve" ? "approved" : "revised");
      setMessage(
        action === "approve"
          ? "Approved — the edition can now be published."
          : "Revision requested — the newsroom has your note.",
      );
      setShowNote(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setNeedsKey(true);
        setMessage("The backend requires an approval key.");
      } else if (e instanceof ApiError && e.status === 409) {
        setMessage("No pending approval for this edition — it may already be decided.");
      } else {
        setMessage(e instanceof Error ? e.message : "Action failed.");
      }
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

  if (done) {
    return (
      <p className={cx("text-sm", done === "approved" ? "text-emerald-300" : "text-amber-300")}>
        {message}
      </p>
    );
  }

  return (
    <div className={cx(!compact && "rounded-lg border border-white/10 bg-white/[0.02] p-4")}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("approve")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#4aa8ff]/20 px-3 py-1.5 text-[13px] font-medium text-[#9fd0ff] transition hover:bg-[#4aa8ff]/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={15} />
          {busy ? "Working…" : "Approve"}
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

      {showNote && (
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
