import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiGet, str } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";
import EditionApprovalActions from "@/components/approval/EditionApprovalActions";
import { editionTone, prettyStatus } from "./status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editions — The Daily NEXA" };

interface EditionRow {
  editionId: string;
  title: string;
  date: string;
  status: string;
  pages: number;
  articles: number;
  aiFallback: boolean;
}

function normalizeEdition(r: Record<string, unknown>): EditionRow {
  const pageIds = Array.isArray(r.pageIds) ? r.pageIds : [];
  const articleIds = Array.isArray(r.articleIds) ? r.articleIds : [];
  return {
    editionId: str(r.editionId ?? r.id),
    title: str(r.title, "Untitled edition"),
    date: str(r.date),
    status: str(r.status, "draft"),
    pages: pageIds.length,
    articles: articleIds.length,
    aiFallback: r.aiFallback === true,
  };
}

export default async function EditionsPage() {
  let editions: EditionRow[] | null = null;
  try {
    const raw = await apiGet<{ success: boolean; data: unknown }>("/api/editions?limit=50");
    const list = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
    editions = list.map(normalizeEdition).filter((e) => e.editionId);
  } catch {
    editions = null;
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[#f2f4ff]">Editions</h1>
        <p className="mt-1 text-sm text-[#b8c0dc]">
          Every edition the newsroom has produced. Only published editions are readable.
        </p>

        {editions === null ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <ErrorState
              title="Couldn't load editions"
              detail="The backend didn't respond. Start it with `npm run dev` in backend/ and try again."
              backHref="/newsroom"
            />
          </div>
        ) : editions.length === 0 ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02]">
            <EmptyState
              title="No editions yet"
              detail="The newsroom hasn't produced an edition. Run one from the campus panel's “Run edition” button, then check back here."
            />
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {editions.map((e) => (
              <li
                key={e.editionId}
                className="rounded-lg border border-white/10 bg-white/[0.02] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <Link
                  href={`/edition/${e.editionId}`}
                  className="group flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-[#f2f4ff]">{e.title}</p>
                    <p className="mt-0.5 text-sm text-[#8f97b8]">
                      {formatDate(e.date) || "Undated"} · {e.pages} {e.pages === 1 ? "page" : "pages"} ·{" "}
                      {e.articles} {e.articles === 1 ? "article" : "articles"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={editionTone(e.status)}>{prettyStatus(e.status)}</Badge>
                    {e.aiFallback && <Badge tone="amber">Built without AI</Badge>}
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[#8f97b8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#f2f4ff]"
                  />
                </Link>
                {e.status === "in-review" && (
                  <div className="border-t border-white/10 px-5 py-3">
                    <EditionApprovalActions editionId={e.editionId} compact />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
