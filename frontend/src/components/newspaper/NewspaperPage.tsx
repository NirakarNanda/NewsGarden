import type { Article } from "@/types/article";
import ArticleCard from "./ArticleCard";
import ArticleHero from "./ArticleHero";
import SectionHeader from "./SectionHeader";

function groupByCategory(articles: Article[]): [string, Article[]][] {
  const groups = new Map<string, Article[]>();
  for (const a of articles) {
    const list = groups.get(a.category) ?? [];
    list.push(a);
    groups.set(a.category, list);
  }
  return [...groups.entries()];
}

export default function NewspaperPage({
  pageNumber,
  title,
  date,
  articles,
  onOpenArticle,
}: {
  pageNumber: number;
  title: string;
  date: string;
  articles: Article[];
  onOpenArticle?: (article: Article) => void;
}) {
  const isFront = pageNumber === 1;
  const [lead, ...rest] = articles;
  const groups = groupByCategory(rest);

  return (
    <div className="bg-[#f7f2e7] px-6 py-6 text-[#221c12] md:px-10 md:py-8">
      {isFront ? (
        <header className="border-b-4 border-double border-[#221c12]/70 pb-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#221c12]/55">
            A cozy AI newsroom
          </p>
          <h1
            className="mt-1 text-balance text-5xl font-bold tracking-tight md:text-6xl"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {title}
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#221c12]/55">{date}</p>
        </header>
      ) : (
        <header className="flex items-baseline justify-between border-b-2 border-[#221c12]/70 pb-3">
          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
            {title}
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-[#221c12]/55">{date}</p>
        </header>
      )}

      {articles.length === 0 ? (
        <p className="py-16 text-center font-serif italic text-[#221c12]/50">
          This page is still being written…
        </p>
      ) : (
        <div className="mt-6">
          {isFront && lead && (
            <div className="border-b border-[#221c12]/20 pb-6">
              <ArticleHero article={lead} onOpen={onOpenArticle} />
            </div>
          )}
          {groups.map(([category, items]) => (
            <section key={category} className="mt-6">
              <SectionHeader title={category} />
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                {items.map((a) => (
                  <ArticleCard key={a.articleId} article={a} onOpen={onOpenArticle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-8 flex items-center justify-between border-t border-[#221c12]/20 pt-3 text-[11px] uppercase tracking-[0.25em] text-[#221c12]/45">
        <span>{title}</span>
        <span>Page {pageNumber}</span>
      </footer>
    </div>
  );
}
