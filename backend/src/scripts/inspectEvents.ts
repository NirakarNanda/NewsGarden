import {
  connectDatabase,
} from "../config/database.js";

import {
  Event,
} from "../models/Event.js";

import {
  Article,
} from "../models/Article.js";

async function inspectEvents() {

  await connectDatabase();

  const events = await Event.find()
    .sort({
      updatedAt: -1,
    })
    .limit(10);

  console.log("\n==============================");
  console.log("       NEWSGARDEN EVENTS");
  console.log("==============================\n");

  for (const event of events) {

    console.log(
      `\n🧠 EVENT: ${event.eventId}`
    );

    console.log(
      `Title: ${event.title}`
    );

    console.log(
      `Articles: ${event.articleIds.length}`
    );

    const articles =
      await Article.find({
        articleId: {
          $in: event.articleIds,
        },
      });

    for (const article of articles) {

      console.log(
        `  📰 ${article.source}`
      );

      console.log(
        `     ${article.title}`
      );

      console.log(
        `     ${article.url}`
      );
    }

    console.log(
      "--------------------------------"
    );
  }

  process.exit(0);
}

void inspectEvents();