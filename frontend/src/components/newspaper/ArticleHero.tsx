"use client";

import { useEffect, useState } from "react";
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
  // A stored imageUrl may point at a file that no longer
  // exists (older placeholder paths) or fail to load for
  // any other reason. Never show a broken-image icon:
  // fall back to a styled plate instead.
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [article.imageUrl]);

  return (
    <article
      onClick={onOpen ? () => onOpen(article) : undefined}
      className={cx(onOpen && "cursor-pointer", className)}
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6d3b]">
        {article.category}
      </p>
      <h2 className="text-balance font-serif text-4xl font-black leading-tight text-[#221c12] md:text-5xl">
        {article.title}
      </h2>
      <p className="mt-3 text-xs uppercase tracking-widest text-[#221c12]/50">
        {article.source}
        {article.publishedAt
          ? ` · ${new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
          : ""}
      </p>
      {article.imageUrl &&
        (imgBroken ? (
          <div
            role="img"
            aria-label={`${article.category} illustration`}
            className="mt-4 flex aspect-[16/9] w-full items-center justify-center rounded-sm border border-[#221c12]/15 bg-gradient-to-br from-[#efe3c8] to-[#d5c096]"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#221c12]/50">
              {article.category}
            </span>
          </div>
        ) : (
          <figure className="mt-4 overflow-hidden rounded-sm border border-[#221c12]/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              onError={() => setImgBroken(true)}
              className="aspect-[16/9] w-full object-cover"
            />
            {article.imageCredit && (
              <figcaption className="bg-[#f7f2e7] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#221c12]/55">
                {article.imageCredit}
              </figcaption>
            )}
          </figure>
        ))}
      {article.summary && (
        <p className="mt-4 font-serif text-[17px] italic leading-relaxed text-[#221c12]/85">
          {article.summary}
        </p>
      )}
      {article.body && (
        <div className="mt-4 columns-1 gap-8 text-[14px] leading-relaxed text-[#221c12]/80 md:columns-2">
          {article.body.split("\n\n").map((para, i) => (
            <p
              key={i}
              className={cx(
                "mb-3 break-inside-avoid",
                i === 0 &&
                  "first-letter:float-left first-letter:mr-1.5 first-letter:font-serif first-letter:text-[2.6em] first-letter:font-black first-letter:leading-[0.85] first-letter:text-[#221c12]",
              )}
            >
              {para}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
