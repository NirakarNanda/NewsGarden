import { cx } from "@/lib/utils";
import type { Article } from "@/types/article";

export default function ArticleHero({
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
      className={cx(onOpen && "cursor-pointer", className)}
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6d3b]">
        {article.category}
      </p>
      <h2 className="font-serif text-4xl font-black leading-tight text-[#221c12] md:text-5xl">
        {article.title}
      </h2>
      <p className="mt-3 text-xs uppercase tracking-widest text-[#221c12]/50">
        {article.source}
        {article.publishedAt
          ? ` · ${new Date(article.publishedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
          : ""}
      </p>
      {article.imageUrl && (
        <figure className="mt-4 overflow-hidden rounded-sm border border-[#221c12]/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        </figure>
      )}
      {article.summary && (
        <p className="mt-4 font-serif text-[17px] italic leading-relaxed text-[#221c12]/85">
          {article.summary}
        </p>
      )}
      {article.body && (
        <div className="mt-4 columns-1 gap-8 text-[14px] leading-relaxed text-[#221c12]/80 md:columns-2">
          {article.body.split("\n\n").map((para, i) => (
            <p key={i} className="mb-3 break-inside-avoid">
              {para}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
