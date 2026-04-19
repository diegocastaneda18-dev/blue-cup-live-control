import { CatchStatus, CatchType, PrismaClient, ReviewAction, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const TOURNAMENT_ID = "00000000-0000-0000-0000-000000000001";
const RULE_RELEASE_ID = "00000000-0000-0000-0000-000000000101";
const RULE_WEIGH_ID = "00000000-0000-0000-0000-000000000102";

const CATCH_IDS = {
  submitted: "00000000-0000-0000-0000-000000000201",
  pending_review: "00000000-0000-0000-0000-000000000202",
  approved: "00000000-0000-0000-0000-000000000203",
  rejected: "00000000-0000-0000-0000-000000000204",
  penalized: "00000000-0000-0000-0000-000000000205",
  official: "00000000-0000-0000-0000-000000000206"
} as const;

async function upsertUser(params: { email: string; displayName: string; role: Role; password: string }) {
  const passwordHash = await argon2.hash(params.password);
  return prisma.user.upsert({
    where: { email: params.email },
    update: { displayName: params.displayName, role: params.role, passwordHash, isActive: true },
    create: { email: params.email, displayName: params.displayName, role: params.role, passwordHash, isActive: true }
  });
}

async function main() {
  const tournament = await prisma.tournament.upsert({
    where: { id: TOURNAMENT_ID },
    update: {
      name: "Las Marias Blue Cup 2026",
      location: "Las Marías, Puerto Rico",
      startsAt: new Date("2026-07-10T10:00:00.000Z"),
      endsAt: new Date("2026-07-12T22:00:00.000Z"),
      isActive: true,
      isOfficial: true
    },
    create: {
      id: TOURNAMENT_ID,
      name: "Las Marias Blue Cup 2026",
      location: "Las Marías, Puerto Rico",
      startsAt: new Date("2026-07-10T10:00:00.000Z"),
      endsAt: new Date("2026-07-12T22:00:00.000Z"),
      isActive: true,
      isOfficial: true
    }
  });

  const admin = await upsertUser({
    email: "admin@bluecup.local",
    displayName: "Sofía Méndez",
    role: Role.admin,
    password: "BlueCup123!"
  });
  const committeeUser = await upsertUser({
    email: "committee@bluecup.local",
    displayName: "Roberto Vélez",
    role: Role.committee,
    password: "BlueCup123!"
  });
  const captain = await upsertUser({
    email: "captain@bluecup.local",
    displayName: "Miguel Torres",
    role: Role.captain,
    password: "BlueCup123!"
  });
  const teamMember = await upsertUser({
    email: "team.member@bluecup.local",
    displayName: "Ana Rivera",
    role: Role.team_member,
    password: "BlueCup123!"
  });

  const catRelease = await prisma.category.upsert({
    where: { tournamentId_code: { tournamentId: tournament.id, code: "REL" } },
    update: { name: "Release" },
    create: { tournamentId: tournament.id, code: "REL", name: "Release" }
  });
  const catWeigh = await prisma.category.upsert({
    where: { tournamentId_code: { tournamentId: tournament.id, code: "WEI" } },
    update: { name: "Weigh-in" },
    create: { tournamentId: tournament.id, code: "WEI", name: "Weigh-in" }
  });

  const specDorado = await prisma.species.upsert({
    where: { tournamentId_code: { tournamentId: tournament.id, code: "DOR" } },
    update: { name: "Dorado (Mahi-Mahi)" },
    create: { tournamentId: tournament.id, code: "DOR", name: "Dorado (Mahi-Mahi)" }
  });
  const specMarlin = await prisma.species.upsert({
    where: { tournamentId_code: { tournamentId: tournament.id, code: "BLM" } },
    update: { name: "Blue Marlin" },
    create: { tournamentId: tournament.id, code: "BLM", name: "Blue Marlin" }
  });
  const specTuna = await prisma.species.upsert({
    where: { tournamentId_code: { tournamentId: tournament.id, code: "YFT" } },
    update: { name: "Yellowfin Tuna" },
    create: { tournamentId: tournament.id, code: "YFT", name: "Yellowfin Tuna" }
  });

  await prisma.scoringRule.upsert({
    where: { id: RULE_RELEASE_ID },
    update: {},
    create: {
      id: RULE_RELEASE_ID,
      tournamentId: tournament.id,
      categoryId: catRelease.id,
      name: "Release points",
      basePoints: 100,
      weightKgMultiplier: 0,
      lengthCmPointsPerCm: 0,
      requiresMedia: true,
      isActive: true
    }
  });
  await prisma.scoringRule.upsert({
    where: { id: RULE_WEIGH_ID },
    update: {},
    create: {
      id: RULE_WEIGH_ID,
      tournamentId: tournament.id,
      categoryId: catWeigh.id,
      name: "Weigh-in points",
      basePoints: 0,
      weightKgMultiplier: 10,
      lengthCmPointsPerCm: 0,
      requiresMedia: true,
      isActive: true
    }
  });

  const teamAzul = await prisma.team.upsert({
    where: { tournamentId_name: { tournamentId: tournament.id, name: "Azul Dorado" } },
    update: { captainUserId: captain.id },
    create: { tournamentId: tournament.id, name: "Azul Dorado", captainUserId: captain.id }
  });
  const teamMarlin = await prisma.team.upsert({
    where: { tournamentId_name: { tournamentId: tournament.id, name: "Marlin Royale" } },
    update: {},
    create: { tournamentId: tournament.id, name: "Marlin Royale", captainUserId: null }
  });
  const teamTuna = await prisma.team.upsert({
    where: { tournamentId_name: { tournamentId: tournament.id, name: "Atún Brisa" } },
    update: {},
    create: { tournamentId: tournament.id, name: "Atún Brisa", captainUserId: null }
  });

  await prisma.boat.upsert({
    where: { teamId: teamAzul.id },
    update: { name: "Blue Cupper", registry: "PR-BC-007" },
    create: { teamId: teamAzul.id, name: "Blue Cupper", registry: "PR-BC-007" }
  });
  await prisma.boat.upsert({
    where: { teamId: teamMarlin.id },
    update: { name: "Golden Wake", registry: "PR-GW-011" },
    create: { teamId: teamMarlin.id, name: "Golden Wake", registry: "PR-GW-011" }
  });
  await prisma.boat.upsert({
    where: { teamId: teamTuna.id },
    update: { name: "Sal Marina", registry: "PR-SM-042" },
    create: { teamId: teamTuna.id, name: "Sal Marina", registry: "PR-SM-042" }
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamAzul.id, userId: captain.id } },
    update: { roleLabel: "Captain" },
    create: { teamId: teamAzul.id, userId: captain.id, roleLabel: "Captain" }
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamAzul.id, userId: teamMember.id } },
    update: { roleLabel: "Angler" },
    create: { teamId: teamAzul.id, userId: teamMember.id, roleLabel: "Angler" }
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamMarlin.id, userId: teamMember.id } },
    update: { roleLabel: "Deck hand" },
    create: { teamId: teamMarlin.id, userId: teamMember.id, roleLabel: "Deck hand" }
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamTuna.id, userId: teamMember.id } },
    update: { roleLabel: "Mate" },
    create: { teamId: teamTuna.id, userId: teamMember.id, roleLabel: "Mate" }
  });

  await prisma.catchReview.deleteMany({ where: { catch: { tournamentId: tournament.id } } });
  await prisma.catchMedia.deleteMany({ where: { catch: { tournamentId: tournament.id } } });
  await prisma.catch.deleteMany({ where: { tournamentId: tournament.id } });

  const baseCatch = {
    tournamentId: tournament.id,
    categoryId: catRelease.id,
    type: CatchType.release,
    occurredAtClient: new Date("2026-07-11T14:30:00.000Z"),
    weightKg: 8.4,
    lengthCm: 92
  };

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.submitted,
      ...baseCatch,
      teamId: teamAzul.id,
      createdById: captain.id,
      speciesId: specDorado.id,
      status: CatchStatus.submitted,
      scorePreliminary: 0,
      scoreOfficial: 0,
      notes: "Early morning strike — photo uploading dockside."
    }
  });

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.pending_review,
      ...baseCatch,
      teamId: teamMarlin.id,
      createdById: teamMember.id,
      speciesId: specMarlin.id,
      status: CatchStatus.pending_review,
      scorePreliminary: 0,
      scoreOfficial: 0,
      notes: "Committee review requested for release video angle.",
      occurredAtClient: new Date("2026-07-11T16:45:00.000Z")
    }
  });

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.approved,
      ...baseCatch,
      teamId: teamAzul.id,
      createdById: captain.id,
      speciesId: specDorado.id,
      status: CatchStatus.approved,
      scorePreliminary: 280,
      scoreOfficial: 0,
      notes: "Solid release — verified dorsal and tail in frame.",
      occurredAtClient: new Date("2026-07-11T11:20:00.000Z")
    }
  });

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.rejected,
      ...baseCatch,
      teamId: teamTuna.id,
      createdById: teamMember.id,
      speciesId: specTuna.id,
      status: CatchStatus.rejected,
      scorePreliminary: 0,
      scoreOfficial: 0,
      notes: "Timestamp mismatch with boat log.",
      occurredAtClient: new Date("2026-07-10T18:00:00.000Z")
    }
  });

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.penalized,
      ...baseCatch,
      teamId: teamTuna.id,
      createdById: teamMember.id,
      speciesId: specTuna.id,
      status: CatchStatus.penalized,
      scorePreliminary: 0,
      scoreOfficial: 0,
      notes: "Late GPS tag — procedural penalty applied.",
      occurredAtClient: new Date("2026-07-11T09:15:00.000Z")
    }
  });

  await prisma.catch.create({
    data: {
      id: CATCH_IDS.official,
      tournamentId: tournament.id,
      teamId: teamMarlin.id,
      createdById: teamMember.id,
      categoryId: catWeigh.id,
      speciesId: specMarlin.id,
      type: CatchType.weigh_in,
      status: CatchStatus.official,
      scorePreliminary: 0,
      scoreOfficial: 310,
      weightKg: 142.5,
      lengthCm: 248,
      notes: "Weigh-station certified — tournament record contender.",
      occurredAtClient: new Date("2026-07-12T17:00:00.000Z")
    }
  });

  await prisma.catchReview.create({
    data: {
      catchId: CATCH_IDS.approved,
      reviewerId: committeeUser.id,
      action: ReviewAction.approve,
      notes: "Release criteria met. Preliminary points locked."
    }
  });
  await prisma.catchReview.create({
    data: {
      catchId: CATCH_IDS.rejected,
      reviewerId: committeeUser.id,
      action: ReviewAction.reject,
      notes: "Cannot reconcile catch time with official channel log."
    }
  });
  await prisma.catchReview.create({
    data: {
      catchId: CATCH_IDS.penalized,
      reviewerId: committeeUser.id,
      action: ReviewAction.penalize,
      notes: "15-point procedural adjustment per tournament rules section 4.2.",
      penaltyPoints: 15
    }
  });
  await prisma.catchReview.create({
    data: {
      catchId: CATCH_IDS.official,
      reviewerId: committeeUser.id,
      action: ReviewAction.approve,
      notes: "Weigh-in verified; official score posted to leaderboard."
    }
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed", {
    tournament: tournament.name,
    tournamentId: tournament.id,
    users: {
      admin: admin.email,
      committee: committeeUser.email,
      captain: captain.email,
      team_member: teamMember.email
    },
    password: "BlueCup123!",
    leaderboardHint:
      "Marlin Royale leads on official points; Azul Dorado has strong preliminary; Atún Brisa has rejected/penalized only."
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
