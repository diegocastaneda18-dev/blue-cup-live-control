"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { apiFetch } from "../../lib/api";

export default function OfficialResultsPage() {
  const [tournamentId] = useState("00000000-0000-0000-0000-000000000001");
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any[]>(`/leaderboard?tournamentId=${encodeURIComponent(tournamentId)}`)
      .then(setRows)
      .catch((e: any) => setError(e?.message ?? "Failed to load results"));
  }, [tournamentId]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 850 }}>Official results</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>
            Results become “official” when admin marks catches official and locks the tournament.
          </div>
        </div>
        <Link href="/leaderboard">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Standings (official column)">
        <div style={{ display: "grid", gap: 10 }}>
          {(rows ?? []).map((r, idx) => (
            <div
              key={r.teamId}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr 160px",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 10
              }}
            >
              <div style={{ color: "#C9A24A", fontWeight: 900, fontSize: 20 }}>#{idx + 1}</div>
              <div style={{ fontWeight: 800 }}>{r.teamName}</div>
              <div style={{ textAlign: "right", color: "#A8B6CC", fontSize: 12 }}>
                official
                <div style={{ color: "#EAF2FF", fontWeight: 850, fontSize: 18 }}>{Number(r.pointsOfficial).toFixed(1)}</div>
              </div>
            </div>
          ))}
          {rows && rows.length === 0 ? <div style={{ color: "#A8B6CC" }}>No teams yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}

