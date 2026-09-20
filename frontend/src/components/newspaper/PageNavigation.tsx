import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/utils";

export default function PageNavigation({
  page,
  totalPages,
  onChange,
}: {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#221c12]/20 px-2 text-sm text-[#221c12] transition-colors hover:bg-[#221c12]/5 disabled:pointer-events-none disabled:opacity-30";
  return (
    <nav aria-label="Newspaper pages" className="flex items-center justify-center gap-2">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? "page" : undefined}
          className={cx(btn, p === page && "bg-[#221c12] font-bold text-[#f7f2e7] hover:bg-[#221c12]")}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
