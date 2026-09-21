import Link from "next/link";
import { Newspaper } from "lucide-react";
import NewsroomNav from "@/components/layout/NewsroomNav";

/** Rendered when the edition id doesn't exist (page.tsx calls notFound()). */
export default function EditionNotFound() {
  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#8f97b8]">
          <Newspaper size={22} />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[#f2f4ff]">No such edition</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#b8c0dc]">
          This edition doesn&apos;t exist yet — or it hasn&apos;t been published, and only published
          editions are public.
        </p>
        <Link
          href="/newsroom/editions"
          className="mt-6 inline-block rounded-md border border-white/15 px-4 py-2 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
        >
          Browse editions
        </Link>
      </div>
    </div>
  );
}
