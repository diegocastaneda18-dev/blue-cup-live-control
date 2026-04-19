"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { demoCatchHistoryRows, demoParticipantTeamDashboard, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../lib/api";

type TeamDashboard = any;

export default function TeamPage() {
  const [data, setData] = useState<TeamDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<TeamDashboard>("/teams/me/dashboard")
      .then((d) => {
        if (isDemoModeEnabled() && d && (!d.catches || d.catches.length === 0)) {
          setData({ ...d, catches: demoCatchHistoryRows() });
        } else {
          setData(d);
        }
        setError(null);
      })
      .catch((e: any) => {
        if (isDemoModeEnabled()) {
          setData(demoParticipantTeamDashboard());
          setError(null);
        } else {
          setError(e?.details?.message ?? "Failed to load team");
        }
      });
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Team dashboard</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Boat, roster, latest catches</div>
        </div>
        <Link href="/submit-catch">
          <Button>Submit catch</Button>
        </Link>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      {data ? (
        <>
          <Card title="Team">
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <span style={{ color: "#A8B6CC" }}>Name</span>: <b>{data.name}</b>
              </div>
              <div>
                <span style={{ color: "#A8B6CC" }}>Tournament</span>: <b>{data.tournament?.name}</b>
              </div>
              <div>
                <span style={{ color: "#A8B6CC" }}>Boat</span>: <b>{data.boat?.name ?? "—"}</b>
              </div>
            </div>
          </Card>

          <Card title="Latest catches">
            <div style={{ display: "grid", gap: 10 }}>
              {(data.catches ?? []).slice(0, 10).map((c: any) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 10
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 700 }}>
                      {c.category?.name} · {c.type}
                    </div>
                    <div style={{ color: "#A8B6CC", fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ color: "#A8B6CC", fontSize: 12 }}>
                    status: <b style={{ color: "#EAF2FF" }}>{c.status}</b>
                  </div>
                </div>
              ))}
              {(!data.catches || data.catches.length === 0) && <div style={{ color: "#A8B6CC" }}>No catches yet.</div>}
            </div>
          </Card>
        </>
      ) : (
        <Card title="Loading">Fetching team data…</Card>
      )}
    </div>
  );
}

