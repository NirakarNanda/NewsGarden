"use client";

import { useEffect } from "react";
import NewsroomNav from "@/components/layout/NewsroomNav";
import { ErrorState } from "@/components/ui/DataState";

/**
 * Catches render/data errors in the edition route. Offers a real retry
 * (reset) instead of a dead end; never renders fake edition content.
 */
export default function EditionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced for debugging; the page itself stays user-facing.
    console.error("Edition route failed:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <ErrorState
        title="This edition hit a snag"
        detail="Something went wrong while rendering it. The backend may be unreachable, or the edition data may be incomplete."
        backHref="/newsroom/editions"
      />
      <div className="-mt-16 text-center">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-white/15 px-4 py-2 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
