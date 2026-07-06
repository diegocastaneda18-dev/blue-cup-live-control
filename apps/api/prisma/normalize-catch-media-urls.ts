import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  isLegacyCatchMedia,
  planCatchMediaNormalization,
  type CatchMediaLike
} from "../src/modules/catch/media-url.helper";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const rows = await prisma.catchMedia.findMany({
    orderBy: { createdAt: "asc" }
  });

  let updated = 0;
  let legacyMarked = 0;
  let urlsRebuilt = 0;
  let unavailableMarked = 0;

  for (const row of rows) {
    const media: CatchMediaLike = {
      id: row.id,
      type: row.type,
      objectKey: row.objectKey,
      url: row.url,
      storageProvider: row.storageProvider,
      uploadStatus: row.uploadStatus,
      errorMessage: row.errorMessage,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes
    };

    const patch = await planCatchMediaNormalization(media);
    if (!Object.keys(patch).length) continue;

    if (patch.storageProvider === "legacy") legacyMarked++;
    if (patch.url) urlsRebuilt++;
    if (patch.errorMessage) unavailableMarked++;

    if (dryRun) {
      console.log(`[dry-run] ${row.id}`, patch);
      updated++;
      continue;
    }

    await prisma.catchMedia.update({
      where: { id: row.id },
      data: patch
    });
    updated++;
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned: rows.length,
        updated,
        legacyMarked,
        urlsRebuilt,
        unavailableMarked
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
