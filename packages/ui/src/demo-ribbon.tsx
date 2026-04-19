"use client";

function isDemoEnvOn() {
  return (
    process.env.NEXT_PUBLIC_BLUECUP_DEMO === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

/**
 * Full-width ribbon when demo mode env is enabled.
 * Premium dark + gold accent to match the rest of the shell.
 */
export function DemoModeRibbon() {
  if (!isDemoEnvOn()) return null;

  return (
    <div
      role="status"
      aria-label="Demo mode active"
      style={{
        position: "relative",
        zIndex: 60,
        borderBottom: "1px solid rgba(245, 158, 11, 0.35)",
        background: "linear-gradient(90deg, #020617 0%, rgba(120, 53, 15, 0.35) 50%, #020617 100%)",
        padding: "10px 16px",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)"
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 650,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(253, 230, 138, 0.95)"
        }}
      >
        Demo mode
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: 12,
          lineHeight: 1.45,
          color: "rgba(226, 232, 240, 0.9)"
        }}
      >
        Sample tournaments, teams, catches, and leaderboard appear when the API returns no data.
      </p>
    </div>
  );
}
