"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { apiGet, str } from "@/lib/api";
import { onNewsEvent, type NewsEvent } from "@/lib/socket";
import NewsroomNav from "@/components/layout/NewsroomNav";
import NewspaperPage from "@/components/newspaper/NewspaperPage";
import EditionApprovalActions from "@/components/approval/EditionApprovalActions";
import Badge from "@/components/ui/Badge";
import type { Article } from "@/types/article";
import { normalizeArticle } from "@/types/article";

const STAGES = ["research", "write", "headline", "illustrate"] as const;
type Stage = (typeof STAGES)[number];

interface StoryState {
  articleId: string;
  stage: Stage | "done";
  startedAt: string;
}

interface LiveEvent {
  id: string;
  name: string;
  at: string;
  detail: string;
}

function eventDetail(e: NewsEvent): string {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  switch (e.type) {
    case "STORY_STARTED":
      return `Story started${p.articleId ? ` — ${str(p.articleId).slice(0, 8)}` : ""}`;
    case "STORY_STAGE":
      return `Story stage: ${str(p.stage)}${p.articleId ? ` — ${str(p.articleId).slice(0, 8)}` : ""}`;
    case "STORY_COMPLETED":
      return `Story completed${p.articleId ? ` — ${str(p.articleId).slice(0, 8)}` : ""}`;
    case "PAGE_SLOT_FILLED":
      return `Page ${str(p.pageNumber)} laid out (${Array.isArray(p.articleIds) ? p.articleIds.length : 0} stories)`;
    case "EDITION_RUN_FAILED":
      return `Run failed: ${str(p.error)}`;
    case "EDITION_READY_FOR_APPROVAL":
      return "Edition ready for approval";
    default:
      return e.type;
  }
}

export default function EditionLivePage({ editionId }: { editionId: string }) {
  const [stories, setStories] = useState<Map<string, StoryState>>(new Map());
  const [pages, setPages] = useState<{ pageNumber: number; articleIds: string[] }[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [inReview, setInReview] = useState(false);
  const [published, setPublished] = useState(false);
  const [articles, setArticles] = useState<Map<string, Article>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to the live SSE stream, filtered to this edition.
  useEffect(() => {
    return onNewsEvent((e: NewsEvent) => {
      const p = (e.payload ?? {}) as Record<string, unknown>;
      const eid = str(p.editionId);
      if (eid && eid !== editionId) return;

      const detail = eventDetail(e);
      setEvents((prev) => [
        ...prev.slice(-49),
        {
          id: `${e.type}-${Date.now()}-${Math.random()}`,
          name: e.type,
          at: new Date().toISOString(),
          detail,
        },
      ]);

      if (e.type === "STORY_STARTED") {
        const articleId = str(p.articleId);
        if (articleId) {
          setStories((prev) => {
            const next = new Map(prev);
            next.set(articleId, { articleId, stage: "research", startedAt: new Date().toISOString() });
            return next;
          });
        }
      } else if (e.type === "STORY_STAGE") {
        const articleId = str(p.articleId);
        const stage = str(p.stage) as Stage;
        if (articleId && (STAGES as readonly string[]).includes(stage)) {
          setStories((prev) => {
            const next = new Map(prev);
            const s = next.get(articleId);
            if (s) next.set(articleId, { ...s, stage });
            return next;
          });
        }
      } else if (e.type === "STORY_COMPLETED") {
        const articleId = str(p.articleId);
        if (articleId) {
          setStories((prev) => {
            const next = new Map(prev);
            const s = next.get(articleId);
            if (s) next.set(articleId, { ...s, stage: "done" });
            return next;
          });
          // Fetch the completed article for the page view.
          void apiGet<{ success: boolean; data: unknown }>(`/api/articles/${articleId}`)
            .then((raw) => {
              const r = raw?.data as Record<string, unknown> | undefined;
              if (r) {
                const a = normalizeArticle(r);
                setArticles((prev) => new Map(prev).set(articleId, a));
              }
            })
            .catch(() => {});
        }
      } else if (e.type === "PAGE_SLOT_FILLED") {
        const pageNumber = Number(p.pageNumber) || 1;
        const articleIds = Array.isArray(p.articleIds) ? p.articleIds.map(String) : [];
        setPages((prev) => {
          const next = prev.filter((pg) => pg.pageNumber !== pageNumber);
          next.push({ pageNumber, articleIds });
          return next.sort((a, b) => a.pageNumber - b.pageNumber);
        });
      } else if (e.type === "EDITION_RUN_FAILED") {
        setFailed(str(p.error) || "The edition run failed.");
      } else if (e.type === "EDITION_READY_FOR_APPROVAL") {
        setInReview(true);
      }
    });
  }, [editionId]);

  // Auto-scroll the event log.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  const completedCount = useMemo(
    () => [...stories.values()].filter((s) => s.stage === "done").length,
    [stories]
  );

  const pageArticles: Article[][] = useMemo(
    () =>
      pages.map((pg) =>
        pg.articleIds
          .map((id) => articles.get(id))
          .filter((a): a is Article => a !== undefined)
      ),
    [pages, articles]
  );

  const handleRetry = async () => {
    setFailed(null);
    setStories(new Map());
    setPages([]);
    // Re-run as a quick edition; the backend 409-guards concurrent runs.
    try {
      await fetch("/api/editions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quick" }),
      });
    } catch {
      setFailed("Couldn't restart the run.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <NewsroomNav active="/newsroom/editions" />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Link
          href="/newsroom/editions"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#b8c0dc] transition-colors hover:text-[#f2f4ff]"
        >
          <ArrowLeft size={15} />
          All editions
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#f2f4ff]">Live build</h1>
          <Badge tone={failed ? "red" : inReview ? "amber" : "blue"}>
            {failed ? "Failed" : inReview ? "In review" : "Building"}
          </Badge>
          {completedCount > 0 && (
            <span className="text-sm text-[#8f97b8]">
              {completedCount} {completedCount === 1 ? "story" : "stories"} completed
            </span>
          )}
        </div>

        {failed && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 p-4">
            <p className="text-sm font-medium text-red-200">Edition run failed</p>
            <p className="mt-1 text-sm text-[#dfe4ff]">{failed}</p>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-400/20 px-3 py-1.5 text-[13px] font-medium text-red-200 transition hover:bg-red-400/30"
            >
              <RefreshCcw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Stage stepper: per-story pipeline progress. */}
        {stories.size > 0 && (
          <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h2 className="mb-3 text-sm font-medium text-[#dfe4ff]">Stories</h2>
            <div className="space-y-2">
              {[...stories.values()].map((s) => (
                <div key={s.articleId} className="flex items-center gap-3">
                  <span className="w-20 truncate font-mono text-[11px] text-[#8f97b8]">
                    {s.articleId.slice(0, 8)}
                  </span>
                  <div className="flex flex-1 items-center gap-1">
                    {STAGES.map((stage, i) => {
                      const stageIdx = STAGES.indexOf(s.stage as Stage);
                      const done = s.stage === "done" || i < stageIdx;
                      const current = s.stage === stage;
                      return (
                        <div key={stage} className="flex flex-1 items-center gap-1">
                          <div
                            className={`h-1.5 flex-1 rounded-full ${
                              done
                                ? "bg-emerald-400"
                                : current
                                  ? "bg-amber-300"
                                  : "bg-white/10"
                            }`}
                            title={stage}
                          />
                          {i < STAGES.length - 1 && <div className="w-1" />}
                        </div>
                      );
                    })}
                  </div>
                  <span className="w-24 text-right text-[11px] text-[#8f97b8]">
                    {s.stage === "done" ? "done" : s.stage}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Live page: skeleton slots fill in as PAGE_SLOT_FILLED arrives. */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-[#dfe4ff]">Page</h2>
          {pageArticles.length > 0 && pageArticles[0].length > 0 ? (
            <NewspaperPage
              pageNumber={1}
              title="Live edition"
              date={new Date().toISOString().slice(0, 10)}
              articles={pageArticles[0]}
            />
          ) : (
            <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-white/10 bg-white/[0.03] p-4"
                  data-testid={`skeleton-slot-${i}`}
                >
                  <div className="mb-2 h-4 w-3/4 rounded bg-white/10" />
                  <div className="mb-2 h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* At in-review, reuse the Task 3 approval actions. */}
        {inReview && !published && (
          <section className="mb-6">
            <EditionApprovalActions
              editionId={editionId}
              onStatusChange={(s) => {
                if (s === "published") setPublished(true);
              }}
            />
          </section>
        )}

        {published && (
          <p className="mb-6 text-sm text-emerald-300">
            Published —{" "}
            <Link
              href={`/edition/${editionId}`}
              className="underline underline-offset-2 hover:text-emerald-200"
            >
              open the published edition
            </Link>
          </p>
        )}

        {/* SSE event log. */}
        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-medium text-[#dfe4ff]">Live events</h2>
          <div
            className="max-h-64 space-y-1 overflow-y-auto font-mono text-[12px]"
            data-testid="live-event-log"
          >
            {events.length === 0 && (
              <p className="text-[#8f97b8]">Waiting for build events…</p>
            )}
            {events.map((e) => (
              <p key={e.id} className="text-[#b8c0dc]">
                <span className="text-[#8f97b8]">
                  {new Date(e.at).toLocaleTimeString()}
                </span>{" "}
                <span className="text-amber-200">{e.name}</span> — {e.detail}
              </p>
            ))}
            <div ref={bottomRef} />
          </div>
        </section>
      </main>
    </div>
  );
}
