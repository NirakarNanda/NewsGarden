import {
  DiscoveryAgentBase,
} from "./DiscoveryAgentBase.js";

import type {
  NewsSource,
} from "../../../config/sources.js";

export class NatureAgent
  extends DiscoveryAgentBase {

  id = "nature-agent";

  name = "Nature Agent";

  role =
    "Global Nature & Environment News Discovery";

  department = "discovery";

  category = "nature";

  desk = "environment";

  feeds: NewsSource[] = [

    {
      source: "The Guardian Environment",
      url: "https://www.theguardian.com/environment/rss",
      category: "nature",
    },

    {
      source: "Yale Environment 360",
      url: "https://e360.yale.edu/feed",
      category: "nature",
    },

    {
      source: "Mongabay",
      url: "https://news.mongabay.com/feed/",
      category: "nature",
    },

    {
      source: "Grist",
      url: "https://grist.org/feed/",
      category: "nature",
    },
  ];
}
