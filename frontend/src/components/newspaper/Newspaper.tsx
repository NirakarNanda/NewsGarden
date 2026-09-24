"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Article } from "@/types/article";
import { motionOK } from "@/lib/motion";
import NewspaperPage from "./NewspaperPage";

type Flip = {
  /** 1-based page the leaf is turning away from / toward. */
  from: number;
  to: number;
  /** 1 = turning forward (leaf sweeps left), -1 = turning back (leaf sweeps right). */
  dir: 1 | -1;
};

const FLIP_MS = 650;

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
  const total = Math.max(1, pages.length);
  const clampPage = useCallback(
    (p: number) => Math.min(Math.max(1, p), total),
    [total],
  );
  const [page, setPage] = useState(() => clampPage(initialPage));
  const [flip, setFlip] = useState<Flip | null>(null);

  const goTo = useCallback(
    (p: number) => {
      const target = clampPage(p);
      if (target === page || flip) return;
      if (!motionOK()) {
        setPage(target);
        return;
      }
      setFlip({ from: page, to: target, dir: target > page ? 1 : -1 });
    },
    [clampPage, flip, page],
  );

  // Arrow-key page turning.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(page + 1);
      else if (e.key === "ArrowLeft") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, page]);

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

  // During a flip the base shows the page being revealed and the leaf shows
  // the page turning over it.
  const basePage = flip ? (flip.dir === 1 ? flip.to : flip.from) : page;
  const leafPage = flip ? (flip.dir === 1 ? flip.from : flip.to) : page;

  const arrowCls =
    "pointer-events-auto absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#f7f2e7] text-[#221c12] shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-black/25 transition hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-25";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Book stage: perspective on the wrapper, the leaf turns around the spine. */}
      <div
        className="relative"
        style={{ perspective: "2200px" }}
        aria-roledescription="book"
        aria-label={`${title}, page ${page} of ${total}`}
      >
        <div className="overflow-hidden rounded-md shadow-2xl ring-1 ring-black/20">
          <NewspaperPage
            pageNumber={basePage}
            title={title}
            date={date}
            articles={pages[basePage - 1] ?? []}
            onOpenArticle={onOpenArticle}
          />
        </div>

        {flip && (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "left center",
              animation: `newsleaf-${flip.dir === 1 ? "fwd" : "back"} ${FLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
            onAnimationEnd={() => {
              setPage(flip.to);
              setFlip(null);
            }}
          >
            {/* Leaf front: the page turning over. */}
            <div
              className="absolute inset-0 overflow-hidden rounded-md shadow-[12px_0_32px_rgba(0,0,0,0.35)] ring-1 ring-black/20"
              style={{ backfaceVisibility: "hidden" }}
            >
              <NewspaperPage
                pageNumber={leafPage}
                title={title}
                date={date}
                articles={pages[leafPage - 1] ?? []}
              />
            </div>
            {/* Leaf back: blank paper, slightly shaded like a real page back. */}
            <div
              className="absolute inset-0 rounded-md bg-[#efe7d3]"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                boxShadow: "inset -24px 0 48px rgba(0,0,0,0.12)",
              }}
            />
          </div>
        )}

        {/* Side arrows: the only page controls, floating at the page edges. */}
        <button
          type="button"
          className={`${arrowCls} left-3 md:left-5`}
          disabled={page <= 1 || !!flip}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className={`${arrowCls} right-3 md:right-5`}
          disabled={page >= total || !!flip}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
