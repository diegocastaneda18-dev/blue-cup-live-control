"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { Card, Button } from "@bluecup/ui";
import { DEMO_TOURNAMENT_ID, demoLeaderboardForTournament, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../lib/api";

export default function PublicLeaderboardPage() {
  const [tournamentId] = useState(DEMO_TOURNAMENT_ID);
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
      setError(e?.message ?? "Failed to load leaderboard");
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
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 850 }}>Live leaderboard</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Auto-updates after every committee decision</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="ghost" onClick={refresh}>
            Refresh
          </Button>
          <Link href="/results">
            <Button variant="ghost">Official results</Button>
          </Link>
        </div>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Standings">
        <div style={{ display: "grid", gap: 10 }}>
          {(rows ?? []).map((r, idx) => (
            <div
              key={r.teamId}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr 140px 140px 120px",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 10
              }}
            >
              <div style={{ color: "#C9A24A", fontWeight: 900, fontSize: 20 }}>#{idx + 1}</div>
              <div style={{ fontWeight: 800 }}>
                <Link href={`/teams/${r.teamId}`} style={{ color: "#EAF2FF", textDecoration: "none" }}>
                  {r.teamName}
                </Link>
              </div>
              <div style={{ color: "#A8B6CC", fontSize: 12, textAlign: "right" }}>
                preliminary
                <div style={{ color: "#EAF2FF", fontWeight: 850, fontSize: 16 }}>{Number(r.pointsPreliminary).toFixed(1)}</div>
              </div>
              <div style={{ color: "#A8B6CC", fontSize: 12, textAlign: "right" }}>
                official
                <div style={{ color: "#EAF2FF", fontWeight: 850, fontSize: 16 }}>{Number(r.pointsOfficial).toFixed(1)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Link href={`/teams/${r.teamId}`}>
                  <Button variant="ghost">Team page</Button>
                </Link>
              </div>
            </div>
          ))}
          {rows && rows.length === 0 ? <div style={{ color: "#A8B6CC" }}>No teams yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}

