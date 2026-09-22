"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Newspaper } from "lucide-react";
import { apiPost } from "@/lib/api";
import { authHeaders, loadApprovalKey } from "@/lib/approvalKey";
import Badge from "@/components/ui/Badge";
import NewspaperPage from "@/components/newspaper/NewspaperPage";
import type { Article } from "@/types/article";

export interface AssemblerPage {
  pageId: string;
  pageNumber: number;
  status: "draft" | "approved";
  articles: Article[];
}

interface ApprovePageResponse {
  success: boolean;
  data: { approvedPages: number; totalPages: number };
}

interface CompileResponse {
  success: boolean;
  data: { pageCount: number; status: string };
}

/**
 * Per-page approval + newspaper assembly.
 *
 * The user reviews each page and approves them one by one. Once every
 * page is approved, the "Create full newspaper" button runs the
 * newspaper-compiler agent, which assembles the whole paper.
 */
export default function NewspaperAssembler({
  editionId,
  title,
  date,
  pages,
}: {
  editionId: string;
  title: string;
  date: string;
  pages: AssemblerPage[];
}) {
  const router = useRouter();
  const [approving, setApproving] = useState<number | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState("");

  const allApproved = pages.length > 0 && pages.every((p) => p.status === "approved");

  const handleApprove = async (pageNumber: number) => {
    setApproving(pageNumber);
    setError("");
    try {
      await apiPost<ApprovePageResponse>(
        `/api/editions/${encodeURIComponent(editionId)}/pages/${pageNumber}/approve`,
        undefined,
        { headers: authHeaders(loadApprovalKey()) },
      );
      router.refresh();
    } catch {
      setError(`Couldn't approve page ${pageNumber}.`);
    } finally {
      setApproving(null);
    }
  };

  const handleCompile = async () => {
    setCompiling(true);
    setError("");
    try {
      await apiPost<CompileResponse>(
        `/api/editions/${encodeURIComponent(editionId)}/compile`,
        undefined,
        { headers: authHeaders(loadApprovalKey()) },
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't create the full newspaper.",
      );
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      {pages.map((page) => (
        <section
          key={page.pageId}
          className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-[#f2f4ff]">
              Page {page.pageNumber}
            </h2>
            <Badge tone={page.status === "approved" ? "green" : "default"}>
              {page.status === "approved" ? "Approved" : "Draft"}
            </Badge>
            <span className="ml-auto">
              {page.status === "approved" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                  <Check size={15} /> Approved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleApprove(page.pageNumber)}
                  disabled={approving !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-3.5 py-2 text-sm text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-60"
                >
                  <Check size={15} />
                  {approving === page.pageNumber ? "Approving…" : `Approve page ${page.pageNumber}`}
                </button>
              )}
            </span>
          </div>
          <NewspaperPage
            articles={page.articles}
            pageNumber={page.pageNumber}
            title={title}
            date={date}
          />
        </section>
      ))}

      <div className="rounded-[18px] border border-amber-300/20 bg-amber-400/[0.06] p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="mr-auto">
            <p className="text-sm font-medium text-amber-200">
              {allApproved
                ? "Every page is approved — ready to assemble."
                : "Approve every page to unlock the full newspaper."}
            </p>
            <p className="mt-0.5 text-xs text-[#8f97b8]">
              {pages.filter((p) => p.status === "approved").length} of {pages.length} pages approved
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCompile()}
            disabled={!allApproved || compiling}
            title={allApproved ? "Assemble the whole newspaper from the approved pages" : "Approve all pages first"}
            className="inline-flex items-center gap-2 rounded-[11px] border border-amber-300/40 bg-amber-400/15 px-5 py-2.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Newspaper size={16} />
            {compiling ? "Creating…" : "Create full newspaper"}
          </button>
        </div>
      </div>
    </div>
  );
}
