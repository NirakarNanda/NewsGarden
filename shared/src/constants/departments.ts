// The departments an agent can belong to.
export type Department =
  | "discovery"
  | "research"
  | "editorial"
  | "visual"
  | "design"
  | "quality"
  | "management";

export const DEPARTMENTS: Department[] = [
  "discovery",
  "research",
  "editorial",
  "visual",
  "design",
  "quality",
  "management",
];

// Human-friendly names for the UI.
export const DEPARTMENT_LABELS: Record<Department, string> = {
  discovery: "Discovery",
  research: "Research",
  editorial: "Editorial",
  visual: "Visual",
  design: "Design",
  quality: "Quality",
  management: "Management",
};

// Campus zone components rendered by the frontend.
export type CampusZone =
  | "Newsroom"
  | "ResearchLab"
  | "EditorialRoom"
  | "VisualStudio"
  | "DesignStudio"
  | "QualityRoom";

// Which campus zone each department's agents live in.
export const DEPARTMENT_ZONES: Record<Department, CampusZone> = {
  discovery: "Newsroom",
  research: "ResearchLab",
  editorial: "EditorialRoom",
  visual: "VisualStudio",
  design: "DesignStudio",
  quality: "QualityRoom",
  management: "Newsroom",
};
