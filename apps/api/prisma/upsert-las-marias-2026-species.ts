import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOURNAMENT_NAMES = ["Las Marías Blue Cup 2026", "Las Marias Blue Cup 2026"] as const;

const SPECIES = [
  { code: "BLUE_MARLIN", name: "Blue Marlin", releasePoints: 500 },
  { code: "STRIPE_MARLIN", name: "Stripe Marlin", releasePoints: 150 },
  { code: "SAILFISH", name: "Sailfish", releasePoints: 100 }
] as const;

async function main() {
  const tournament =
    (await prisma.tournament.findFirst({
      where: { name: { in: [...TOURNAMENT_NAMES] } },
      select: { id: true, name: true }
    })) ??
    (await prisma.tournament.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: "desc" },
      select: { id: true, name: true }
    }));

  if (!tournament) {
    throw new Error(
      `Tournament not found. Expected name in: ${TOURNAMENT_NAMES.map((n) => `"${n}"`).join(", ")} ` +
        `or any active tournament. Create/seed one first, then re-run this script.`
    );
  }

  for (const s of SPECIES) {
    await prisma.species.upsert({
      where: {
        tournamentId_code: {
          tournamentId: tournament.id,
          code: s.code
        }
      },
      update: {
        name: s.name,
        releasePoints: s.releasePoints
      },
      create: {
        tournamentId: tournament.id,
        code: s.code,
        name: s.name,
        releasePoints: s.releasePoints
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Upserted ${SPECIES.length} species for tournament "${tournament.name}" (${tournament.id}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

