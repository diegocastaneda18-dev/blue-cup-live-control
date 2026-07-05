import "dotenv/config";
import { JackpotCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOURNAMENT_ID = "2";

const JACKPOT_TIERS = [
  {
    category: JackpotCategory.sonar,
    name: "Sonar $3,000",
    amountUsd: 3000,
    sortOrder: 1,
    isActive: true
  },
  {
    category: JackpotCategory.sonar,
    name: "Sonar $1,000",
    amountUsd: 1000,
    sortOrder: 2,
    isActive: true
  },
  {
    category: JackpotCategory.non_sonar,
    name: "Non Sonar $3,000",
    amountUsd: 3000,
    sortOrder: 1,
    isActive: true
  },
  {
    category: JackpotCategory.non_sonar,
    name: "Non Sonar $1,000",
    amountUsd: 1000,
    sortOrder: 2,
    isActive: true
  }
] as const;

async function main() {
  const tournament = await prisma.tournament.findUnique({
    where: { id: TOURNAMENT_ID },
    select: { id: true, name: true }
  });

  if (!tournament) {
    throw new Error(`Tournament not found (id="${TOURNAMENT_ID}"). Verify the id before running this script.`);
  }

  for (const tier of JACKPOT_TIERS) {
    await prisma.jackpotTier.upsert({
      where: {
        tournamentId_category_sortOrder: {
          tournamentId: TOURNAMENT_ID,
          category: tier.category,
          sortOrder: tier.sortOrder
        }
      },
      update: {
        name: tier.name,
        amountUsd: tier.amountUsd,
        isActive: tier.isActive
      },
      create: {
        tournamentId: TOURNAMENT_ID,
        category: tier.category,
        name: tier.name,
        amountUsd: tier.amountUsd,
        sortOrder: tier.sortOrder,
        isActive: tier.isActive
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Upserted ${JACKPOT_TIERS.length} jackpot tiers for tournament "${tournament.name}" (${tournament.id}).`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
