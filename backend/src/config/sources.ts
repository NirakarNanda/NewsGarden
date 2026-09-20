export interface NewsSource {
  source: string;
  url: string;
  category: string;
}

// RSS feeds the discovery agents can use.
export const techNewsSources: NewsSource[] = [
  {
    source: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "technology",
  },

  {
    source: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "technology",
  },

  {
    source: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    category: "technology",
  },

  {
    source: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    category: "technology",
  },
];