export const LEADERBOARD_REFRESH_EVENT = "bluecup:leaderboard-refresh";

export function dispatchLeaderboardRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEADERBOARD_REFRESH_EVENT));
}
