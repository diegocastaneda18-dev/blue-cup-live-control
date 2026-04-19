/**
 * Demo mode: sample tournaments, teams, catches, and leaderboard when API responses are empty.
 *
 * Enable with either:
 * - `NEXT_PUBLIC_BLUECUP_DEMO=true` (canonical for this repo)
 * - `NEXT_PUBLIC_DEMO_MODE=true` (alias)
 */
export function isDemoModeEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_BLUECUP_DEMO === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

/** @deprecated Use isDemoModeEnabled — kept for existing imports. */
export const isDemoMode = isDemoModeEnabled;
