import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiGet, str } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Edition, NewspaperPage } from "@newsgarden/shared";
import type { Article } from "@/types/article";
import { normalizeArticle } from "@/types/article";
import Badge from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";
import EditionView from "@/components/newspaper/EditionView";
import NewspaperAssembler, { type AssemblerPage } from "@/components/newspaper/NewspaperAssembler";
import EditionApprovalActions from "@/components/approval/EditionApprovalActions";

// Rendered per request: the edition is live newsroom data.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ editionId: string }> };

/** Backend's getEditionWithPages shape: the edition plus its laid-out pages and articles. */
interface EditionWithPages extends Edition {
  pages: NewspaperPage[];

  articles: Record<string, unknown>[];
}

function toArticle(r: Record<string, unknown>): Article {
  const a = normalizeArticle(r);
  // The editorial pipeline may set a punchier headline than the discovered title.
  const headline = str(r.headline);
  return headline ? { ...a, title: headline } : a;
}

async function loadEdition(editionId: string): Promise<EditionWithPages> {
  const raw = await apiGet<{ success: boolean; data: EditionWithPages }>(
    `/api/editions/${encodeURIComponent(editionId)}`,
  );
  if (!raw?.data?.editionId) throw new Error("Unexpected response shape");
  return raw.data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { editionId } = await params;
  try {
    const edition = await loadEdition(editionId);
    return { title: `${edition.title} — NewsGarden` };
  } catch {
    return { title: "Edition — NewsGarden" };
  }
}

export default async function EditionPage({ params }: Params) {
  const { editionId } = await params;

  let edition: EditionWithPages;
  try {
    edition = await loadEdition(editionId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("-> 404")) notFound();
    return (
      <div className="min-h-screen bg-[#0b0f1a]">
        <NewsroomNav active="/newsroom/editions" />
        <ErrorState
          title="Couldn't load this edition"
          detail="The backend didn't respond. Start it with `npm run dev` in backend/ and try again."
          backHref="/newsroom/editions"
        />
      </div>
    );
  }

  if (edition.status !== "published" && edition.status !== "compiled") {
    const byId = new Map(edition.articles.map((a) => [str(a.articleId), toArticle(a)]));
    const rawPages = [...(edition.pages ?? [])].sort((a, b) => a.pageNumber - b.pageNumber);
    const pages: Article[][] = rawPages.map((page) =>
      (page.slots ?? [])
        .map((slot) => (slot.articleId ? byId.get(slot.articleId) : undefined))
        .filter((a): a is Article => a !== undefined),
    );
    const isInReview = edition.status === "in-review";

    return (
      <div className="min-h-screen bg-[#0b0f1a]">
        <NewsroomNav active="/newsroom/editions" />
        {/* Sticky action bar for the human approval gate. */}
        {isInReview && (
          <div className="sticky top-0 z-30 border-b border-amber-300/20 bg-[#141b29]/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
              <div className="mr-auto">
                <p className="text-sm font-medium text-amber-200">Draft, not published</p>
                <p className="text-xs text-[#8f97b8]">
                  Approve each page below, then create the full newspaper.
                </p>
              </div>
              <EditionApprovalActions editionId={edition.editionId} compact />
            </div>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <Link
            href="/newsroom/editions"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#b8c0dc] transition-colors hover:text-[#f2f4ff]"
          >
            <ArrowLeft size={15} />
            All editions
          </Link>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="amber">Draft, not published</Badge>
            <Badge tone={edition.status === "in-review" ? "amber" : "default"}>
              {edition.status.replace("-", " ")}
            </Badge>
            {edition.aiFallback && <Badge tone="amber">Built without AI</Badge>}
          </div>
          <h1 className="mb-6 text-2xl font-semibold text-[#f2f4ff]">{edition.title}</h1>
          {isInReview && rawPages.length > 0 ? (
            /* Per-page approval: approve each page, then create the full newspaper. */
            <NewspaperAssembler
              editionId={edition.editionId}
              title={edition.title}
              date={formatDate(edition.date) || str(edition.date)}
              pages={rawPages.map((page, i) => ({
                pageId: str(page.pageId),
                pageNumber: page.pageNumber,
                status: page.status === "approved" ? "approved" : "draft",
                articles: pages[i] ?? [],
              }) satisfies AssemblerPage)}
            />
          ) : pages.length > 0 ? (
            <EditionView
              title={edition.title}
              date={formatDate(edition.date) || str(edition.date)}
              pages={pages}
            />
          ) : (
            <p className="text-sm text-[#8f97b8]">
              This edition has no pages yet — it may still be building.
            </p>
          )}
          {isInReview && (
            <div className="mt-8">
              <EditionApprovalActions editionId={edition.editionId} />
            </div>
          )}
        </main>
      </div>
    );
  }

  const byId = new Map(edition.articles.map((a) => [str(a.articleId), toArticle(a)]));
  const pages: Article[][] = [...(edition.pages ?? [])]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((page) =>
      (page.slots ?? [])
        .map((slot) => (slot.articleId ? byId.get(slot.articleId) : undefined))
        .filter((a): a is Article => a !== undefined),
    );

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Link
          href="/newsroom/editions"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#b8c0dc] transition-colors hover:text-[#f2f4ff]"
        >
          <ArrowLeft size={15} />
          All editions
        </Link>
        {edition.aiFallback && (
          <p className="mb-4">
            <Badge tone="amber">Built without AI — offline build</Badge>
          </p>
        )}
        <EditionView
          title={edition.title}
          date={formatDate(edition.date) || str(edition.date)}
          pages={pages}
        />
      </main>
    </div>
  );
}
