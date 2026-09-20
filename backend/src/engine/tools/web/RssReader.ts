import Parser from "rss-parser";

export interface RssStory {
  title: string;
  url: string;
  source: string;
  publishedAt?: Date;
  summary?: string;
}

export class RssReader {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  // Read one RSS feed.
  async readFeed(
    feedUrl: string,
    sourceName: string
  ): Promise<RssStory[]> {
    const feed = await this.parser.parseURL(feedUrl);

    return feed.items
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title!.trim(),

        url: item.link!,

        source: sourceName,

        publishedAt: item.isoDate
          ? new Date(item.isoDate)
          : undefined,

        summary: item.contentSnippet?.trim(),
      }));
  }

  // Read several feeds without stopping if one fails.
  async readFeeds(
    feeds: {
      url: string;
      source: string;
    }[]
  ): Promise<RssStory[]> {
    const results: RssStory[] = [];

    for (const feed of feeds) {
      try {
        const stories = await this.readFeed(
          feed.url,
          feed.source
        );

        results.push(...stories);

        console.log(
          `📰 ${feed.source}: ${stories.length} stories`
        );
      } catch (error) {
        console.error(
          `❌ Failed to read ${feed.source}`,

          error instanceof Error
            ? error.message
            : error
        );
      }
    }

    return results;
  }
}