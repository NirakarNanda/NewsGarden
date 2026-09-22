import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { apiGet, str } from "@/lib/api";
import { cx, formatDate } from "@/lib/utils";
import { normalizeArticle } from "@/types/article";
import Badge from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";
import SafeImage from "@/components/newspaper/SafeImage";

// Rendered per request: the article is live newsroom data.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ articleId: string }> };

async function loadArticle(articleId: string): Promise<Record<string, unknown>> {
  const raw = await apiGet<{ success: boolean; data: Record<string, unknown> }>(
    `/api/articles/${encodeURIComponent(articleId)}`,
  );
  if (!raw?.data?.articleId) throw new Error("Unexpected response shape");
  return raw.data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { articleId } = await params;
  try {
    const raw = await loadArticle(articleId);
    const article = normalizeArticle(raw);
    return { title: `${article.title} — NewsGarden` };
  } catch {
    return { title: "Article — NewsGarden" };
  }
}

export default async function ArticlePage({ params }: Params) {
  const { articleId } = await params;

  let raw: Record<string, unknown>;
  try {
    raw = await loadArticle(articleId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("-> 404")) notFound();
    return (
      <div className="min-h-screen bg-[#0b0f1a]">
        <NewsroomNav active="/newsroom/editions" />
        <ErrorState
          title="Couldn't load this article"
          detail="The backend didn't respond. Start it with `npm run dev` in backend/ and try again."
          backHref="/newsroom/editions"
        />
      </div>
    );
  }

  const article = normalizeArticle(raw);
  const headline = str(raw.headline) || article.title;
  const publishedAt = str(raw.publishedAt ?? raw.discoveredAt);
  const paragraphs = str(raw.body ?? article.body)
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <Link
          href="/newsroom/editions"
          className="inline-flex items-center gap-1.5 text-sm text-[#b8c0dc] transition-colors hover:text-[#f2f4ff]"
        >
          <ArrowLeft size={15} />
          All editions
        </Link>

        <article className="mt-6 overflow-hidden rounded-md bg-[#f7f2e7] text-[#221c12] shadow-2xl ring-1 ring-black/20">
          <div className="px-6 py-8 md:px-12 md:py-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6d3b]">
                {article.category}
              </p>
              <Badge tone="default" className="!border-[#221c12]/20 !bg-[#221c12]/5 !text-[#221c12]/60">
                {article.status}
              </Badge>
            </div>

            <h1 className="mt-3 font-serif text-3xl font-black leading-tight md:text-[2.75rem] md:leading-[1.15]">
              {headline}
            </h1>

            <p className="mt-3 text-xs uppercase tracking-widest text-[#221c12]/50">
              {article.source}
              {publishedAt ? ` · ${formatDate(publishedAt)}` : ""}
            </p>

            {article.imageUrl && (
              <figure className="mt-6 overflow-hidden rounded-sm border border-[#221c12]/15">
                <SafeImage src={article.imageUrl} alt={headline} />
              </figure>
            )}

            {article.summary && (
              <p className="mt-6 font-serif text-lg italic leading-relaxed text-[#221c12]/85">
                {article.summary}
              </p>
            )}

            {paragraphs.length > 0 ? (
              <div className="mt-6 space-y-4 font-serif text-[16.5px] leading-[1.75] text-[#221c12]/90">
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={cx(
                      i === 0 &&
                        "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-5xl first-letter:font-black first-letter:leading-[0.9] first-letter:text-[#221c12]",
                    )}
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-6 font-serif italic text-[#221c12]/50">
                The full story is still being written by the newsroom…
              </p>
            )}

            {article.url && (
              <p className="mt-8 border-t border-[#221c12]/15 pt-4">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#8a6d3b] underline decoration-[#8a6d3b]/40 underline-offset-4 hover:decoration-[#8a6d3b]"
                >
                  Read the original source
                  <ArrowUpRight size={14} />
                </a>
              </p>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
