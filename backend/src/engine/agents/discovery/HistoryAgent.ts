import {
  DiscoveryAgentBase,
} from "./DiscoveryAgentBase.js";

import type {
  NewsSource,
} from "../../../config/sources.js";

export class HistoryAgent
  extends DiscoveryAgentBase {

  id = "history-agent";

  name = "History Agent";

  role =
    "Global History & Archaeology News Discovery";

  department = "discovery";

  category = "history";

  desk = "history";

  feeds: NewsSource[] = [

    {
      source: "History Extra",
      url: "https://www.historyextra.com/feed/",
      category: "history",
    },

    {
      source: "Smithsonian",
      url: "https://www.smithsonianmag.com/rss/latest_articles/",
      category: "history",
    },

    {
      source: "Ancient Origins",
      url: "https://www.ancient-origins.net/rss.xml",
      category: "history",
    },

    {
      source: "Archaeology Magazine",
      url: "https://www.archaeology.org/rss",
      category: "history",
    },
  ];
}
