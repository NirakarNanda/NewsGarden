// Words that are too common to identify an event.
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "this",
  "that",
  "these",
  "those",
  "new",
  "latest",
  "report",
  "says",
  "could",
  "would",
  "what",
  "how",
]);

export function normalizeText(
  text: string
): string {
  return text
    .toLowerCase()
    .replace(/&#8217;|&#39;/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getKeywords(
  title: string,
  summary?: string
): string[] {

  const text = normalizeText(
    `${title} ${summary ?? ""}`
  );

  return [
    ...new Set(
      text
        .split(" ")
        .filter(
          (word) =>
            word.length >= 4 &&
            !STOP_WORDS.has(word)
        )
    ),
  ];
}

// Words that are usually useful for identifying
// the actual subject of a story.
export function getTitleKeywords(
  title: string
): string[] {

  const text =
    normalizeText(title);

  return [
    ...new Set(
      text
        .split(" ")
        .filter(
          (word) =>
            word.length >= 4 &&
            !STOP_WORDS.has(word)
        )
    ),
  ];
}

// Calculates overlap between two keyword lists.
export function calculateSimilarity(
  first: string[],
  second: string[]
): number {

  const firstSet =
    new Set(first);

  const secondSet =
    new Set(second);

  if (
    firstSet.size === 0 ||
    secondSet.size === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (const word of firstSet) {
    if (secondSet.has(word)) {
      matches++;
    }
  }

  return (
    matches /
    Math.min(
      firstSet.size,
      secondSet.size
    )
  );
}

// Returns the actual words shared by two articles.
export function getSharedKeywords(
  first: string[],
  second: string[]
): string[] {

  const secondSet =
    new Set(second);

  return first.filter(
    (word) => secondSet.has(word)
  );
}