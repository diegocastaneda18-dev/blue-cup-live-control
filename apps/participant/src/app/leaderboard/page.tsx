"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Card } from "@bluecup/ui";
import { DEMO_TOURNAMENT_ID, demoLeaderboardForTournament, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../lib/api";

export default function LeaderboardPage() {
  const [tournamentId, setTournamentId] = useState(DEMO_TOURNAMENT_ID);
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socket = useMemo(() => io(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000"}/live`), []);

  async function refresh() {
    try {
      const res = await apiFetch<any[]>(`/leaderboard?tournamentId=${encodeURIComponent(tournamentId)}`);
      if (Array.isArray(res) && res.length === 0 && isDemoModeEnabled()) {
        setRows(demoLeaderboardForTournament(tournamentId));
      } else {
        setRows(res);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.details?.message ?? "Failed to load leaderboard");
    }
  }

  useEffect(() => {
    refresh();
    socket.on("leaderboard.refresh", (p: any) => {
      if (p?.tournamentId === tournamentId) refresh();
    });
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Leaderboard</div>
      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Standings (preliminary vs official)">
        <div style={{ display: "grid", gap: 10 }}>
          {(rows ?? []).map((r, idx) => (
            <div
              key={r.teamId}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr 140px 140px",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 10
              }}
            >
              <div style={{ color: "#C9A24A", fontWeight: 800, fontSize: 18 }}>#{idx + 1}</div>
              <div style={{ fontWeight: 750 }}>{r.teamName}</div>
              <div style={{ color: "#A8B6CC", fontSize: 12, textAlign: "right" }}>
                preliminary
                <div style={{ color: "#EAF2FF", fontWeight: 750, fontSize: 16 }}>{Number(r.pointsPreliminary).toFixed(1)}</div>
              </div>
              <div style={{ color: "#A8B6CC", fontSize: 12, textAlign: "right" }}>
                official
                <div style={{ color: "#EAF2FF", fontWeight: 750, fontSize: 16 }}>{Number(r.pointsOfficial).toFixed(1)}</div>
              </div>
            </div>
          ))}
          {rows && rows.length === 0 ? <div style={{ color: "#A8B6CC" }}>No teams yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}

