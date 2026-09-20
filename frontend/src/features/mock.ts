import type { AgentInfo } from "@/types/agent";
import type { ActivityItem } from "@/types/events";
import type { EditionSummary } from "@/types/edition";

export const MOCK_AGENTS: AgentInfo[] = [
  { id: "tech-news", name: "Tech Agent", role: "Tech news discovery", department: "discovery", status: "working", location: "newsroom" },
  { id: "writer", name: "Writer Agent", role: "Article writer", department: "editorial", status: "working", location: "editorial-room" },
  { id: "designer", name: "Designer Agent", role: "Page layout", department: "design", status: "working", location: "design-studio" },
  { id: "fact-checker", name: "Fact Checker", role: "Fact checking", department: "quality", status: "working", location: "quality-room" },
  { id: "illustrator", name: "Illustrator Agent", role: "Illustration", department: "visual", status: "working", location: "visual-studio" },
  { id: "research", name: "Research Agent", role: "Source verification", department: "research", status: "idle", location: "cafe" },
  { id: "culture", name: "Culture Agent", role: "Culture discovery", department: "discovery", status: "idle", location: "manga-library" },
  { id: "science", name: "Science Agent", role: "Science discovery", department: "discovery", status: "idle", location: "badminton-court" },
];

export const MOCK_EDITION: EditionSummary = {
  editionId: "demo",
  pagesCompleted: 6,
  pagesTotal: 8,
  currentStage: 2,
};

/** Same cadence as the reference (13, 9, 7, 5, 3, 0 minutes ago). */
export function mockActivity(): ActivityItem[] {
  const now = Date.now();
  const rows: [string, string, number][] = [
    ["fact-checker", "Fact Checker reviewing sources", 0],
    ["designer", "Designer Agent working on page 2", 3],
    ["illustrator", "Illustrator Agent generating image", 5],
    ["writer", "Writer Agent started an article", 7],
    ["research", "Research Agent verified 5 sources", 9],
    ["tech-news", "Tech Agent found 12 new stories", 13],
  ];
  return rows.map(([agentId, message, ago], i) => ({
    id: `mock-${i}`,
    agentId,
    message,
    at: new Date(now - ago * 60_000).toISOString(),
  }));
}

/** Rotating messages for the demo ticker. */
export const DEMO_FEED: [agentId: string, message: string][] = [
  ["tech-news", "Tech Agent found 3 new stories"],
  ["research", "Research Agent verified 2 sources"],
  ["writer", "Writer Agent finished a draft"],
  ["illustrator", "Illustrator Agent generating image"],
  ["designer", "Designer Agent working on page 3"],
  ["fact-checker", "Fact Checker reviewing sources"],
];
