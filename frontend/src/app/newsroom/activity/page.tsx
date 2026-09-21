import { fetchActivity } from "@/features/activity/activityApi";
import { timeAgo } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/ui/DataState";
import NewsroomNav from "@/components/layout/NewsroomNav";

export const dynamic = "force-dynamic";

export const metadata = { title: "Activity — The Daily NEXA" };

export default async function ActivityPage() {
  let items: Awaited<ReturnType<typeof fetchActivity>> | null = null;
  try {
    items = await fetchActivity();
  } catch {
    items = null;
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/activity" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[#f2f4ff]">Live Activity</h1>
        <p className="mt-1 text-sm text-[#b8c0dc]">What the agents have been doing, newest first.</p>

        {items === null ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <ErrorState
              title="Couldn't load activity"
              detail="The backend didn't respond. Start it with `npm run dev` in backend/ and try again."
              backHref="/newsroom"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02]">
            <EmptyState
              title="No activity yet"
              detail="Once agents start working, their updates will appear here."
            />
          </div>
        ) : (
          <ol aria-live="polite" className="mt-8 space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline gap-4 rounded-lg border border-white/8 bg-white/[0.02] px-5 py-3.5"
              >
                <span className="w-16 shrink-0 text-right text-xs text-[#8f97b8]">
                  {timeAgo(item.at) || "—"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-[#dfe4ff]">{item.message}</p>
                  {item.agentId && (
                    <p className="mt-0.5 text-xs text-[#8f97b8]">{item.agentId}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
