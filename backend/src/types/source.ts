// A news source, as returned by the API.
export interface SourceDTO {
  sourceId: string;

  name: string;

  url: string;

  category: string;

  enabled: boolean;
}
