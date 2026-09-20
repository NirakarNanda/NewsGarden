import { truncate } from "@/lib/utils";
import { cx } from "@/lib/utils";
import type { Article } from "@/types/article";

function Byline({ article }: { article: Article }) {
  return (
    <p className="text-[11px] uppercase tracking-widest text-[#221c12]/50">
      {article.source}
      {article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
    </p>
  );
}

export default function ArticleCard({
  article,
  onOpen,
  className,
}: {
  article: Article;
  onOpen?: (article: Article) => void;
  className?: string;
}) {
  return (
    <article
      onClick={onOpen ? () => onOpen(article) : undefined}
      className={cx(
        "border-t-2 border-[#221c12]/70 pt-3",
        onOpen && "cursor-pointer transition-opacity hover:opacity-80",
        className,
      )}
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6d3b]">
        {article.category}
      </p>
      <h4 className="font-serif text-lg font-bold leading-snug text-[#221c12]">{article.title}</h4>
      <div className="mt-1.5">
        <Byline article={article} />
      </div>
      {article.summary && (
        <p className="mt-2 text-[13px] leading-relaxed text-[#221c12]/75">
          {truncate(article.summary, 220)}
        </p>
      )}
    </article>
  );
}
