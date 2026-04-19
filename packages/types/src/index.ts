export type UserRole = "admin" | "committee" | "captain" | "team_member" | "public_view";

export type JwtUser = {
  sub: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
};

export type CatchType = "release" | "weigh_in";
export type MediaType = "photo" | "video";
export type ReviewAction = "approve" | "reject" | "request_more_evidence" | "penalize";

export * from "./demoReset";
export { isDemoMode, isDemoModeEnabled } from "./demoMode";
export {
  DEMO_TOURNAMENT_ID,
  demoCatchDetailById,
  demoCatchHistoryRows,
  demoDashboardTournaments,
  demoLeaderboardForTournament,
  demoParticipantTeamDashboard,
  demoPendingQueue,
  demoTeamsForTournament,
  demoTeamsSimpleForNewCatch,
  demoTournamentDetail,
  demoTournamentsList
} from "./demoFixtures";
