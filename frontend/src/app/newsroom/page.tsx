import Link from "next/link";
import { Activity, ArrowRight, FileText, Users } from "lucide-react";
import { apiGet, str } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Edition } from "@newsgarden/shared";
import Badge from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";
import { editionTone, prettyStatus } from "./editions/status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Newsroom — NewsGarden" };

const CARDS = [
  {
    href: "/newsroom/agents",
    icon: Users,
    title: "Agents",
    detail: "Who's working, where, and on what — straight from the agent registry.",
  },
  {
    href: "/newsroom/editions",
    icon: FileText,
    title: "Editions",
    detail: "Every edition the newsroom has produced, with its pipeline status.",
  },
  {
    href: "/newsroom/activity",
    icon: Activity,
    title: "Activity",
    detail: "The live feed of what agents are doing across the newsroom.",
  },
];

export default async function NewsroomPage() {
  let latest: Edition | null = null;
  let backendDown = false;
  try {
    const raw = await apiGet<{ success: boolean; data: unknown }>("/api/editions?limit=1");
    const list = Array.isArray(raw.data) ? (raw.data as Record<string, unknown>[]) : [];
    latest = (list[0] as unknown as Edition | undefined) ?? null;
  } catch {
    backendDown = true;
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[#f2f4ff]">The Newsroom</h1>
        <p className="mt-1 text-sm text-[#b8c0dc]">
          Everything happening inside the paper — agents, editions, and the live activity feed.
        </p>

        {backendDown ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <ErrorState
              title="Backend is unreachable"
              detail="The newsroom pages need the backend. Start it with `npm run dev` in backend/ and reload."
              backHref="/"
            />
          </div>
        ) : (
          <>
            {latest && (
              <Link
                href={`/edition/${latest.editionId}`}
                className="mt-8 block rounded-lg border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={editionTone(str(latest.status))}>{prettyStatus(str(latest.status))}</Badge>
                  <span className="text-xs uppercase tracking-widest text-[#8f97b8]">Latest edition</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-[#f2f4ff]">{latest.title}</p>
                <p className="mt-1 text-sm text-[#b8c0dc]">
                  {formatDate(str(latest.date))} · {(latest.articleIds ?? []).length} articles
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#ffd66e]">
                  Read it <ArrowRight size={15} />
                </span>
              </Link>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {CARDS.map(({ href, icon: Icon, title, detail }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-lg border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#20294a] text-[#ffd66e]">
                    <Icon size={19} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[#f2f4ff]">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#b8c0dc]">{detail}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#ffd66e]">
                    Open
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
