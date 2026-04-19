/** Stable demo tournament id (matches sample leaderboard / teams). */
export const DEMO_TOURNAMENT_ID = "b1e00000-0000-4000-8000-000000000001";

const DEMO_TEAM_ALPHA = "b1e00000-0000-4000-8000-000000000010";
const DEMO_TEAM_BRAVO = "b1e00000-0000-4000-8000-000000000011";
const DEMO_TEAM_CHARLIE = "b1e00000-0000-4000-8000-000000000012";

const DEMO_CAPTAIN_USER = "a1111111-1111-4111-8111-111111111101";
const DEMO_MATE_USER = "a1111111-1111-4111-8111-111111111102";

const DEMO_CAT_REL = "b1e00000-0000-4000-8000-000000000021";
const DEMO_CAT_WEI = "b1e00000-0000-4000-8000-000000000022";
const DEMO_SPEC_DOR = "b1e00000-0000-4000-8000-000000000031";

const iso = (s: string) => s;

export function demoTournamentsList(): { id: string; name: string }[] {
  return [{ id: DEMO_TOURNAMENT_ID, name: "Las Marías Showcase (demo)" }];
}

export function demoDashboardTournaments() {
  return [
    {
      id: DEMO_TOURNAMENT_ID,
      name: "Las Marías Showcase (demo)",
      location: "Las Marías, Puerto Rico",
      startsAt: iso("2026-07-10T10:00:00.000Z"),
      endsAt: iso("2026-07-12T22:00:00.000Z"),
      isActive: true,
      isOfficial: true
    }
  ];
}

export function demoLeaderboardForTournament(tournamentId: string) {
  if (tournamentId !== DEMO_TOURNAMENT_ID) return [];
  return [
    { teamId: DEMO_TEAM_BRAVO, teamName: "Marlin Royale (demo)", pointsPreliminary: 40, pointsOfficial: 265 },
    { teamId: DEMO_TEAM_ALPHA, teamName: "Azul Dorado (demo)", pointsPreliminary: 220, pointsOfficial: 0 },
    { teamId: DEMO_TEAM_CHARLIE, teamName: "Atún Brisa (demo)", pointsPreliminary: 0, pointsOfficial: 95 }
  ];
}

export function demoTeamsForTournament(tournamentId: string) {
  if (tournamentId !== DEMO_TOURNAMENT_ID) return [];
  return [
    {
      id: DEMO_TEAM_ALPHA,
      name: "Azul Dorado (demo)",
      captainUserId: DEMO_CAPTAIN_USER,
      boat: { name: "Blue Cupper", registry: "PR-DM-001" },
      members: [
        {
          userId: DEMO_CAPTAIN_USER,
          user: { id: DEMO_CAPTAIN_USER, displayName: "Miguel Torres", email: "captain@demo.local" }
        },
        {
          userId: DEMO_MATE_USER,
          user: { id: DEMO_MATE_USER, displayName: "Ana Rivera", email: "mate@demo.local" }
        }
      ]
    },
    {
      id: DEMO_TEAM_BRAVO,
      name: "Marlin Royale (demo)",
      captainUserId: null,
      boat: { name: "Golden Wake", registry: "PR-DM-002" },
      members: [
        {
          userId: DEMO_MATE_USER,
          user: { id: DEMO_MATE_USER, displayName: "Ana Rivera", email: "mate@demo.local" }
        }
      ]
    },
    {
      id: DEMO_TEAM_CHARLIE,
      name: "Atún Brisa (demo)",
      captainUserId: null,
      boat: { name: "Sal Marina", registry: "PR-DM-003" },
      members: [
        {
          userId: DEMO_MATE_USER,
          user: { id: DEMO_MATE_USER, displayName: "Ana Rivera", email: "mate@demo.local" }
        }
      ]
    }
  ];
}

export function demoCatchHistoryRows() {
  const base = iso("2026-07-11T15:00:00.000Z");
  return [
    {
      id: "b1e00000-0000-4000-8000-00000000c001",
      status: "official",
      type: "weigh_in",
      createdAt: base,
      updatedAt: base,
      scorePreliminary: 0,
      scoreOfficial: 265,
      category: { name: "Weigh-in", code: "WEI" },
      species: { name: "Blue Marlin", code: "BLM" },
      media: [{ id: "m1", type: "photo", url: "#", objectKey: "demo/photo1" }],
      reviews: [] as { id: string; action: string; notes: string | null; penaltyPoints: number | null; createdAt: string }[]
    },
    {
      id: "b1e00000-0000-4000-8000-00000000c002",
      status: "approved",
      type: "release",
      createdAt: base,
      updatedAt: base,
      scorePreliminary: 220,
      scoreOfficial: 0,
      category: { name: "Release", code: "REL" },
      species: { name: "Dorado", code: "DOR" },
      media: [],
      reviews: []
    },
    {
      id: "b1e00000-0000-4000-8000-00000000c003",
      status: "pending_review",
      type: "release",
      createdAt: base,
      updatedAt: base,
      scorePreliminary: 0,
      scoreOfficial: 0,
      category: { name: "Release", code: "REL" },
      species: { name: "Yellowfin Tuna", code: "YFT" },
      media: [{ id: "m2", type: "video", url: "#", objectKey: "demo/video1" }],
      reviews: []
    }
  ];
}

export function demoPendingQueue() {
  const t = iso("2026-07-11T18:30:00.000Z");
  return [
    {
      id: "b1e00000-0000-4000-8000-00000000d001",
      status: "pending_review",
      type: "release",
      createdAt: t,
      weightKg: 6.2,
      lengthCm: 88,
      notes: "Demo queue item — practice review workflow.",
      team: { id: DEMO_TEAM_ALPHA, name: "Azul Dorado (demo)" },
      category: { name: "Release", code: "REL" },
      species: { name: "Dorado", code: "DOR" },
      media: [{ id: "pm1" }]
    },
    {
      id: "b1e00000-0000-4000-8000-00000000d002",
      status: "more_evidence_required",
      type: "weigh_in",
      createdAt: t,
      weightKg: 120,
      lengthCm: 210,
      notes: "Demo: angle on scale display unclear.",
      team: { id: DEMO_TEAM_BRAVO, name: "Marlin Royale (demo)" },
      category: { name: "Weigh-in", code: "WEI" },
      species: { name: "Blue Marlin", code: "BLM" },
      media: []
    }
  ];
}

export function demoTournamentDetail(tournamentId: string) {
  if (tournamentId !== DEMO_TOURNAMENT_ID) return null;
  return {
    id: DEMO_TOURNAMENT_ID,
    name: "Las Marías Showcase (demo)",
    categories: [
      { id: DEMO_CAT_REL, name: "Release", code: "REL" },
      { id: DEMO_CAT_WEI, name: "Weigh-in", code: "WEI" }
    ],
    species: [
      { id: DEMO_SPEC_DOR, name: "Dorado", code: "DOR" },
      { id: "b1e00000-0000-4000-8000-000000000032", name: "Blue Marlin", code: "BLM" },
      { id: "b1e00000-0000-4000-8000-000000000033", name: "Yellowfin Tuna", code: "YFT" }
    ]
  };
}

export function demoTeamsSimpleForNewCatch(tournamentId: string) {
  return demoTeamsForTournament(tournamentId).map((row) => ({
    id: row.id,
    name: row.name,
    captainUserId: row.captainUserId
  }));
}

/** Full catch detail for demo history rows (catch detail page when API has no record). */
export function demoCatchDetailById(catchId: string) {
  const row = demoCatchHistoryRows().find((r) => r.id === catchId);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    type: row.type,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    notes: null as string | null,
    weightKg: null as number | null,
    lengthCm: null as number | null,
    scorePreliminary: row.scorePreliminary ?? null,
    scoreOfficial: row.scoreOfficial ?? null,
    category: row.category ?? null,
    species: row.species ?? null,
    media: (row.media ?? []) as { id: string; type: string; url: string; objectKey: string }[],
    reviews: (row.reviews ?? []) as {
      id: string;
      action: string;
      notes: string | null;
      penaltyPoints: number | null;
      createdAt: string;
      reviewer?: { displayName: string; email: string };
    }[]
  };
}

/** Participant team dashboard when API is unreachable or empty (demo mode). */
export function demoParticipantTeamDashboard() {
  const teams = demoTeamsForTournament(DEMO_TOURNAMENT_ID);
  const t = teams[0];
  if (!t) {
    return {
      id: DEMO_TEAM_ALPHA,
      name: "Azul Dorado (demo)",
      tournament: { id: DEMO_TOURNAMENT_ID, name: "Las Marías Showcase (demo)" },
      boat: { name: "Blue Cupper", registry: "PR-DM-001" },
      catches: demoCatchHistoryRows()
    };
  }
  const boat = t.boat as { name: string; registry?: string | null } | null | undefined;
  return {
    id: t.id,
    name: t.name,
    tournament: { id: DEMO_TOURNAMENT_ID, name: "Las Marías Showcase (demo)" },
    boat: boat ? { name: boat.name, registry: boat.registry ?? null } : null,
    catches: demoCatchHistoryRows()
  };
}
