"use client";

import { useState } from "react";
import type { Article } from "@/types/article";
import NewspaperPage from "./NewspaperPage";
import PageNavigation from "./PageNavigation";

export default function Newspaper({
  title,
  date,
  pages,
  initialPage = 1,
  onOpenArticle,
}: {
  title: string;
  date: string;
  /** One entry per printed page; each entry is that page's articles. */
  pages: Article[][];
  initialPage?: number;
  onOpenArticle?: (article: Article) => void;
}) {
  const [page, setPage] = useState(() =>
    Math.min(Math.max(1, initialPage), Math.max(1, pages.length)),
  );

  if (pages.length === 0) {
    return (
      <div className="rounded-md bg-[#f7f2e7] px-6 py-16 text-center text-[#221c12]">
        <p className="font-serif text-xl italic text-[#221c12]/60">No pages yet.</p>
        <p className="mt-2 text-sm text-[#221c12]/45">
          The newsroom is still gathering today&apos;s stories.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-md shadow-2xl ring-1 ring-black/20">
        <NewspaperPage
          pageNumber={page}
          title={title}
          date={date}
          articles={pages[page - 1] ?? []}
          onOpenArticle={onOpenArticle}
        />
      </div>
      <div className="mt-4">
        <PageNavigation page={page} totalPages={pages.length} onChange={setPage} />
      </div>
    </div>
  );
}
