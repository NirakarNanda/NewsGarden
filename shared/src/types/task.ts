// A task moves through these states.
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface AgentTask {
  id: string;

  // Which agent should handle this task?
  agentId: string;

  // Example: "discover-tech-news"
  type: string;

  status: TaskStatus;

  // Data given to the agent.
  input?: unknown;

  // Result returned by the agent.
  output?: unknown;

  // AI provenance for the output above.
  aiModel?: string;

  // True when the result came from a fallback model.
  aiFallback?: boolean;

  error?: string;

  createdAt: Date | string;

  startedAt?: Date | string;

  completedAt?: Date | string;

  // Useful later if something fails.
  retryCount: number;
}

// Canonical task type strings used across the pipeline.
export const TASK_TYPES = {
  DISCOVER_TECH_NEWS: "discover-tech-news",
  DISCOVER_SCIENCE_NEWS: "discover-science-news",
  DISCOVER_CULTURE_NEWS: "discover-culture-news",
  DISCOVER_HISTORY_NEWS: "discover-history-news",
  DISCOVER_NATURE_NEWS: "discover-nature-news",
  RESEARCH_STORY: "research-story",
  WRITE_ARTICLE: "write-article",
  EDIT_ARTICLE: "edit-article",
  WRITE_HEADLINE: "write-headline",
  GENERATE_ILLUSTRATION: "generate-illustration",
  GENERATE_IMAGE: "generate-image",
  LAYOUT_PAGE: "layout-page",
  LAYOUT_EDITION: "layout-edition",
  FACT_CHECK: "fact-check",
  QUALITY_REVIEW: "quality-review",
} as const;

export type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
