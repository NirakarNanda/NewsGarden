import {
  DiscoveryAgentBase,
} from "./DiscoveryAgentBase.js";

import type {
  NewsSource,
} from "../../../config/sources.js";

export class CultureAgent
  extends DiscoveryAgentBase {

  id = "culture-agent";

  name = "Culture Agent";

  role =
    "Global Culture & Arts News Discovery";

  department = "discovery";

  category = "culture";

  desk = "culture";

  feeds: NewsSource[] = [

    {
      source: "The Guardian Culture",
      url: "https://www.theguardian.com/culture/rss",
      category: "culture",
    },

    {
      source: "BBC Arts",
      url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
      category: "culture",
    },

    {
      source: "Hyperallergic",
      url: "https://hyperallergic.com/feed/",
      category: "culture",
    },

    {
      source: "ARTnews",
      url: "https://www.artnews.com/feed/",
      category: "culture",
    },
  ];
}
