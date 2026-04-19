"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { DEMO_TOURNAMENT_ID, demoLeaderboardForTournament, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../../lib/api";

export default function PublicTeamPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const [tournamentId] = useState(DEMO_TOURNAMENT_ID);
  const [team, setTeam] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // MVP: no public team endpoint yet; we fetch leaderboard and filter.
    apiFetch<any[]>(`/leaderboard?tournamentId=${encodeURIComponent(tournamentId)}`)
      .then((rows) => {
        const list =
          Array.isArray(rows) && rows.length === 0 && isDemoModeEnabled()
            ? demoLeaderboardForTournament(tournamentId)
            : rows;
        setTeam(list.find((r: { teamId: string }) => r.teamId === teamId) ?? null);
      })
      .catch((e: any) => {
        if (isDemoModeEnabled()) {
          const list = demoLeaderboardForTournament(tournamentId);
          setTeam(list.find((r: { teamId: string }) => r.teamId === teamId) ?? null);
          setError(null);
        } else {
          setError(e?.message ?? "Failed to load");
        }
      });
  }, [teamId, tournamentId]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 850 }}>Team page</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Team ID: {teamId}</div>
        </div>
        <Link href="/leaderboard">
          <Button variant="ghost">Back to leaderboard</Button>
        </Link>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Standing">
        {team ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 850, fontSize: 18 }}>{team.teamName}</div>
            <div style={{ display: "flex", gap: 16, color: "#A8B6CC" }}>
              <div>
                preliminary: <b style={{ color: "#EAF2FF" }}>{Number(team.pointsPreliminary).toFixed(1)}</b>
              </div>
              <div>
                official: <b style={{ color: "#EAF2FF" }}>{Number(team.pointsOfficial).toFixed(1)}</b>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: "#A8B6CC" }}>Team not found in standings.</div>
        )}
      </Card>

      <Card title="Highlights (MVP)">
        <div style={{ color: "#A8B6CC" }}>
          Highlights feed will show approved catches + featured media. Next step: add a public endpoint for recent approved catches and media.
        </div>
      </Card>
    </div>
  );
}

