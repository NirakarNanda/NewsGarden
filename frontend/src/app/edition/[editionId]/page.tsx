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
    return { title: `${edition.title} — The Daily NEXA` };
  } catch {
    return { title: "Edition — The Daily NEXA" };
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

  if (edition.status !== "published") {
    return (
      <div className="min-h-screen bg-[#0b0f1a]">
        <NewsroomNav active="/newsroom/editions" />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <Badge tone="amber">{edition.status.replace("-", " ")}</Badge>
          {edition.aiFallback && <Badge tone="amber">Built without AI</Badge>}
          <h1 className="mt-4 text-2xl font-semibold text-[#f2f4ff]">{edition.title}</h1>
          <p className="mt-2 text-sm text-[#b8c0dc]">
            This edition isn&apos;t published yet — check back once the newsroom approves it.
          </p>
          {edition.status === "in-review" && (
            <div className="mt-6 text-left">
              <EditionApprovalActions editionId={edition.editionId} />
            </div>
          )}
          <Link
            href="/newsroom/editions"
            className="mt-6 inline-block rounded-md border border-white/15 px-4 py-2 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
          >
            All editions
          </Link>
        </div>
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
