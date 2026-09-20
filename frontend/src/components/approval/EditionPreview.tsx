import type { Article } from "@/types/article";
import Newspaper from "@/components/newspaper/Newspaper";

/**
 * Read-only preview of the edition awaiting approval.
 * Renders through the same Newspaper components readers see —
 * no actions, no editing.
 */
export default function EditionPreview({
  title,
  date,
  pages,
}: {
  title: string;
  date: string;
  pages: Article[][];
}) {
  return <Newspaper title={title} date={date} pages={pages} />;
}
