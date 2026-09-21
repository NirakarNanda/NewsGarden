import Link from "next/link";
import { AlertTriangle, Inbox } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * Honest loading/error/empty states for the newsroom pages.
 * Never renders fake content: when the backend is unreachable
 * the caller shows ErrorState, never mock data.
 */
export function ErrorState({
  title = "Couldn't reach the newsroom",
  detail = "The backend didn't respond. Start it with `npm run dev` in backend/ and try again.",
  backHref = "/newsroom",
}: {
  title?: string;
  detail?: string;
  backHref?: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-400/10 text-rose-300">
        <AlertTriangle size={22} />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-[#f2f4ff]">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#b8c0dc]">{detail}</p>
      <Link
        href={backHref}
        className="mt-6 inline-block rounded-md border border-white/15 px-4 py-2 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
      >
        Back to newsroom
      </Link>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  detail?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto max-w-xl px-6 py-20 text-center", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[#8f97b8]">
        <Inbox size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#f2f4ff]">{title}</h2>
      {detail && <p className="mt-2 text-sm leading-relaxed text-[#b8c0dc]">{detail}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-block rounded-md border border-white/15 px-4 py-2 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
