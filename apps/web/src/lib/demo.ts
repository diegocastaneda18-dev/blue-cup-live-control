/**
 * Web-local demo helpers for routes that must not depend on runtime `@bluecup/types` imports
 * (e.g. server components). Logic mirrors `@bluecup/types` demo fixtures / demoMode.
 */
const DEMO_TOURNAMENT_ID = "b1e00000-0000-4000-8000-000000000001";

const iso = (s: string) => s;

export function isDemoModeEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_BLUECUP_DEMO === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
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
