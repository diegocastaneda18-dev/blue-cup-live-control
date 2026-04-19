"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { DEMO_TOURNAMENT_ID, demoPendingQueue, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../lib/api";

export default function ReviewDashboard() {
  const [tournamentId, setTournamentId] = useState(DEMO_TOURNAMENT_ID);
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await apiFetch<any[]>(`/committee/catches/pending?tournamentId=${encodeURIComponent(tournamentId)}`);
      if (Array.isArray(res) && res.length === 0 && isDemoModeEnabled()) {
        setRows(demoPendingQueue());
      } else {
        setRows(res);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.details?.message ?? "Failed to load pending queue");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Pending review queue</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Approve, reject, request more evidence, penalize</div>
        </div>
        <Button variant="ghost" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Pending catches">
        <div style={{ display: "grid", gap: 10 }}>
          {(rows ?? []).map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 10
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 750 }}>
                  {c.team?.name} · {c.category?.name} · {c.type}
                </div>
                <div style={{ color: "#A8B6CC", fontSize: 12 }}>
                  status <b style={{ color: "#EAF2FF" }}>{c.status}</b> · media {c.media?.length ?? 0}
                </div>
              </div>
              <Link href={`/review/${c.id}`}>
                <Button>Review</Button>
              </Link>
            </div>
          ))}
          {rows && rows.length === 0 ? <div style={{ color: "#A8B6CC" }}>Queue is empty.</div> : null}
        </div>
      </Card>
    </div>
  );
}

