export interface AgentDefinition {
  id: string;

  name: string;

  role: string;

  department: string;
}

// Every agent the engine worker registers.
// Ids must match exactly what the engine uses.
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: "tech-news-agent",
    name: "Tech News Agent",
    role: "Discovers technology news",
    department: "discovery",
  },

  {
    id: "science-news-agent",
    name: "Science News Agent",
    role: "Discovers science news",
    department: "discovery",
  },

  {
    id: "culture-agent",
    name: "Culture Agent",
    role: "Discovers culture news",
    department: "discovery",
  },

  {
    id: "history-agent",
    name: "History Agent",
    role: "Discovers history news",
    department: "discovery",
  },

  {
    id: "nature-agent",
    name: "Nature Agent",
    role: "Discovers nature news",
    department: "discovery",
  },

  {
    id: "article-writer-agent",
    name: "Article Writer Agent",
    role: "Writes articles from research",
    department: "editorial",
  },

  {
    id: "editor-agent",
    name: "Editor Agent",
    role: "Edits article drafts",
    department: "editorial",
  },

  {
    id: "headline-agent",
    name: "Headline Agent",
    role: "Writes headlines",
    department: "editorial",
  },

  {
    id: "illustration-agent",
    name: "Illustration Agent",
    role: "Generates illustrations",
    department: "visual",
  },

  {
    id: "image-agent",
    name: "Image Agent",
    role: "Generates images",
    department: "visual",
  },

  {
    id: "page-layout-agent",
    name: "Page Layout Agent",
    role: "Lays out newspaper pages",
    department: "design",
  },

  {
    id: "edition-layout-agent",
    name: "Edition Layout Agent",
    role: "Lays out the full edition",
    department: "design",
  },

  {
    id: "fact-check-agent",
    name: "Fact Check Agent",
    role: "Fact-checks article content",
    department: "quality",
  },

  {
    id: "quality-agent",
    name: "Quality Agent",
    role: "Reviews edition quality",
    department: "quality",
  },

  {
    id: "brain-agent",
    name: "Brain Agent",
    role: "Orchestrates the newsroom",
    department: "management",
  },
];
