import {
  DiscoveryAgentBase,
} from "./DiscoveryAgentBase.js";

import type {
  NewsSource,
} from "../../../config/sources.js";

export class ScienceNewsAgent
  extends DiscoveryAgentBase {

  id = "science-news-agent";

  name = "Science News Agent";

  role =
    "Global Science News Discovery";

  department = "discovery";

  category = "science";

  desk = "science";

  feeds: NewsSource[] = [

    {
      source: "ScienceDaily",
      url: "https://www.sciencedaily.com/rss/top/science.xml",
      category: "science",
    },

    {
      source: "Phys.org",
      url: "https://phys.org/rss-feed/",
      category: "science",
    },

    {
      source: "New Scientist",
      url: "https://www.newscientist.com/feed/",
      category: "science",
    },

    {
      source: "EurekAlert",
      url: "https://www.eurekalert.org/rss.xml",
      category: "science",
    },
  ];
}
