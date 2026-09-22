"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiDelete } from "@/lib/api";
import { authHeaders, loadApprovalKey } from "@/lib/approvalKey";

/**
 * Delete button for a single edition row. Asks for confirmation,
 * calls DELETE /api/editions/:id, then refreshes the list.
 */
export default function DeleteEditionButton({ editionId, title }: { editionId: string; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await apiDelete<{ success: boolean }>(`/api/editions/${encodeURIComponent(editionId)}`, {
        headers: authHeaders(loadApprovalKey()),
      });
      router.refresh();
    } catch {
      setError("Couldn't delete this edition.");
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-300">{error}</span>}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        title={confirming ? "Click again to confirm deletion" : `Delete "${title}"`}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-60 ${
          confirming
            ? "border-red-400/50 bg-red-500/15 text-red-200 hover:bg-red-500/25"
            : "border-white/10 text-[#8f97b8] hover:border-red-400/40 hover:text-red-200"
        }`}
      >
        <Trash2 size={13} />
        {deleting ? "Deleting…" : confirming ? "Confirm delete" : "Delete"}
      </button>
      {confirming && !deleting && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2 py-1.5 text-xs text-[#8f97b8] hover:text-[#e6e9ff]"
        >
          Cancel
        </button>
      )}
    </span>
  );
}
