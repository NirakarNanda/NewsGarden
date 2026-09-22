/*
 * Clear all newsroom content: editions, pages, approvals, articles,
 * tasks and activity events. Leaves sources/events/ledger alone.
 *
 * This is the "start fresh" escape hatch for a local/dev database
 * full of failed or stuck editions. There is no undo.
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/clearNewsroom.ts --yes
 *
 * Requires MONGODB_URI (same env the backend uses).
 */
import mongoose from "mongoose";

import { Edition } from "../models/Edition.js";
import { NewspaperPage } from "../models/NewspaperPage.js";
import { Approval } from "../models/Approval.js";
import { Article } from "../models/Article.js";
import { Task } from "../models/Task.js";
import { ActivityEvent } from "../models/ActivityEvent.js";

async function main(): Promise<void> {

  if (!process.argv.includes("--yes")) {

    console.error(
      "Refusing to wipe without --yes. Run with --yes to confirm."
    );

    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {

    console.error("MONGODB_URI is not set.");

    process.exit(1);
  }

  await mongoose.connect(uri);

  const counts: Record<string, number> = {};

  counts.editions =
    (await Edition.deleteMany({})).deletedCount ?? 0;

  counts.pages =
    (await NewspaperPage.deleteMany({})).deletedCount ?? 0;

  counts.approvals =
    (await Approval.deleteMany({})).deletedCount ?? 0;

  counts.articles =
    (await Article.deleteMany({})).deletedCount ?? 0;

  counts.tasks =
    (await Task.deleteMany({})).deletedCount ?? 0;

  counts.activityEvents =
    (await ActivityEvent.deleteMany({})).deletedCount ?? 0;

  console.log("Newsroom cleared:", counts);

  await mongoose.disconnect();
}

main().catch((error) => {

  console.error("clearNewsroom failed:", error);

  process.exit(1);
});
