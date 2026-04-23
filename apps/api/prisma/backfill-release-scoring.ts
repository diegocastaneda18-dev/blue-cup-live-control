import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SpeciesPointsRule = { points: number; names: string[]; codes: string[] };

const RULES: SpeciesPointsRule[] = [
  { points: 500, names: ["Black Marlin"], codes: ["BMA", "BLM-BLK", "BLK"] },
  { points: 500, names: ["Blue Marlin"], codes: ["BLM"] },
  { points: 150, names: ["Stripe Marlin", "Striped Marlin"], codes: ["STM", "STR"] },
  { points: 100, names: ["Sailfish"], codes: ["SAI", "SAF"] }
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

async function backfillSpeciesReleasePoints() {
  for (const rule of RULES) {
    const codes = rule.codes.map((c) => c.trim()).filter(Boolean);
    const names = rule.names.map((n) => n.trim()).filter(Boolean);

    // Prefer exact codes; also support name matches for existing databases.
    if (codes.length) {
      await prisma.species.updateMany({
        where: { code: { in: codes } },
        data: { releasePoints: rule.points }
      });
    }

    for (const name of names) {
      await prisma.species.updateMany({
        where: { name: { equals: name, mode: "insensitive" } },
        data: { releasePoints: rule.points }
      });
    }
  }
}

async function backfillReleaseCatches() {
  const rows = await prisma.catch.findMany({
    where: { type: "release", status: { in: ["approved", "official"] } },
    select: { id: true, speciesId: true }
  });

  const speciesIds = [...new Set(rows.map((r) => r.speciesId).filter(Boolean))] as string[];
  const species = await prisma.species.findMany({
    where: { id: { in: speciesIds } },
    select: { id: true, releasePoints: true }
  });
  const pointsBySpecies = new Map(species.map((s) => [s.id, s.releasePoints]));

  const updates = rows.map((c) =>
    prisma.catch.update({
      where: { id: c.id },
      data: { scoreOfficial: pointsBySpecies.get(c.speciesId ?? "") ?? 0 }
    })
  );

  // Safe to run multiple times; writes deterministic values.
  const chunkSize = 100;
  for (let i = 0; i < updates.length; i += chunkSize) {
    await prisma.$transaction(updates.slice(i, i + chunkSize));
  }
}

async function main() {
  await backfillSpeciesReleasePoints();
  await backfillReleaseCatches();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

