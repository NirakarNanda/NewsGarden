export interface ResearchSource {
  title: string;
  url: string;
  source: string;
  publishedAt?: Date;
  summary?: string;
}

export interface ResearchReportData {
  researchId: string;
  eventId: string;

  headline: string;

  sources: ResearchSource[];

  keyFacts: string[];

  context: string[];

  conflictingInformation: string[];

  confidence: number;

  status:
    | "pending"
    | "researching"
    | "completed"
    | "failed";

  createdAt: Date;
  updatedAt: Date;
}