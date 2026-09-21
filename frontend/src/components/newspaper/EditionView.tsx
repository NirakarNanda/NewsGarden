"use client";

import { useRouter } from "next/navigation";
import type { Article } from "@/types/article";
import Newspaper from "./Newspaper";

/**
 * Client wrapper around the (client) Newspaper component so the
 * server-rendered edition page can navigate to /article/[id]
 * when a reader opens a story.
 */
export default function EditionView({
  title,
  date,
  pages,
}: {
  title: string;
  date: string;
  /** One entry per printed page; each entry is that page's articles. */
  pages: Article[][];
}) {
  const router = useRouter();
  return (
    <Newspaper
      title={title}
      date={date}
      pages={pages}
      onOpenArticle={(article) => router.push(`/article/${article.articleId}`)}
    />
  );
}
