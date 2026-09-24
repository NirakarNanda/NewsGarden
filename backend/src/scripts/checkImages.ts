/*
 * Diagnose missing newspaper images: reports how many articles actually
 * have an imageUrl stored, what those URLs look like, and whether the
 * latest edition's articles carry images.
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/checkImages.ts
 *
 * Requires MONGODB_URI (same env the backend uses). Read-only: it never
 * writes or deletes anything.
 */
import mongoose from "mongoose";

import { Article } from "../models/Article.js";
import { Edition } from "../models/Edition.js";

function describeUrl(url: string | undefined): string {
  if (!url) return "(none)";
  if (url.startsWith("data:")) return `data-uri placeholder (${url.length} chars)`;
  return url.length > 90 ? `${url.slice(0, 90)}…` : url;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const total = await Article.countDocuments({});
  const withImage = await Article.countDocuments({
    imageUrl: { $exists: true, $ne: "" },
  });

  console.log(`Articles total:        ${total}`);
  console.log(`Articles with image:   ${withImage}`);
  console.log(`Articles without:      ${total - withImage}`);
  console.log("");

  // What do the stored URLs look like?
  const samples = await Article.find({ imageUrl: { $exists: true, $ne: "" } })
    .sort({ discoveredAt: -1 })
    .limit(5)
    .select({ title: 1, imageUrl: 1, imageCredit: 1 })
    .lean();
  if (samples.length > 0) {
    console.log("Newest articles with images:");
    for (const a of samples) {
      console.log(`  - ${(a.title as string)?.slice(0, 60)}`);
      console.log(`    url:    ${describeUrl(a.imageUrl as string | undefined)}`);
      console.log(`    credit: ${(a.imageCredit as string) || "(none)"}`);
    }
    console.log("");
  }

  // Does the latest edition's articles have images?
  const latest = await Edition.findOne({}).sort({ date: -1 }).lean();
  if (latest) {
    const ids = (latest.articleIds as string[]) ?? [];
    const imgs = await Article.countDocuments({
      articleId: { $in: ids },
      imageUrl: { $exists: true, $ne: "" },
    });
    console.log(
      `Latest edition "${(latest.title as string) ?? "(untitled)"}" ` +
        `(${(latest.status as string) ?? "?"}): ${imgs}/${ids.length} articles have images.`
    );
  } else {
    console.log("No editions found.");
  }

  if (total > 0 && withImage === 0) {
    console.log("");
    console.log(
      "DIAGNOSIS: no article has an imageUrl, so the illustration step never " +
        "succeeded for this database. Likely causes:\n" +
        "  1. The backend running the editions predates the illustration " +
        "     feature (commit aa660c6) — pull latest and restart it.\n" +
        "  2. Editions were built before illustration existed — run a fresh " +
        "     edition; old articles will not gain images retroactively.\n" +
        "  3. The illustration step is failing (e.g. no network to " +
        "     commons.wikimedia.org) — check backend logs for " +
        "     'StoryWorkflow failed at generate-illustration'."
    );
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
