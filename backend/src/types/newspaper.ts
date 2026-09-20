export interface NewspaperConfig {
  name: string;

  tagline: string;

  // Edition section names, e.g. "technology".
  sections: string[];

  // Target number of articles per edition.
  articlesPerEdition: number;
}
