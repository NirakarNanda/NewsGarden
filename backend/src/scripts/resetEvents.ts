import {
  connectDatabase,
} from "../config/database.js";

import {
  Event,
} from "../models/Event.js";

import {
  Article,
} from "../models/Article.js";

async function resetEvents() {

  await connectDatabase();

  const eventResult =
    await Event.deleteMany({});

  const articleResult =
    await Article.updateMany(
      {
        eventId: {
          $exists: true,
        },
      },
      {
        $unset: {
          eventId: "",
        },
      }
    );

  console.log(
    `🗑️ Removed ${eventResult.deletedCount} events.`
  );

  console.log(
    `🔄 Reset ${articleResult.modifiedCount} articles.`
  );

  process.exit(0);
}

void resetEvents();