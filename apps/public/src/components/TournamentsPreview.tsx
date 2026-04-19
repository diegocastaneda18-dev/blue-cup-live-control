"use client";

import Link from "next/link";
import { Button, Card } from "@bluecup/ui";
import { demoDashboardTournaments, isDemoModeEnabled } from "@bluecup/types";
import { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isOfficial: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export function TournamentsPreview() {
  const [rows, setRows] = useState<Tournament[] | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/tournaments`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Tournament[];
        if (cancelled) return;
        if (Array.isArray(data) && data.length === 0 && isDemoModeEnabled()) {
          setRows(demoDashboardTournaments());
          setDemo(true);
        } else {
          setRows(Array.isArray(data) ? data : []);
          setDemo(false);
        }
      } catch {
        if (cancelled) return;
        if (isDemoModeEnabled()) {
          setRows(demoDashboardTournaments());
          setDemo(true);
        } else {
          setRows([]);
          setDemo(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) {
    return <Card title="Tournaments">Loading…</Card>;
  }

  return (
    <Card title="Tournaments">
      {demo ? (
        <div style={{ color: "#FDE68A", fontSize: 12, marginBottom: 10 }}>
          Demo: sample tournaments (API empty or unreachable).
        </div>
      ) : null}
      {rows.length === 0 ? (
        <div style={{ color: "#A8B6CC" }}>No tournaments yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "#EAF2FF" }}>{t.name}</div>
                <div style={{ color: "#A8B6CC", fontSize: 12, marginTop: 4 }}>
                  {t.isOfficial ? "Official" : "Preliminary"} · {t.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <Link href="/leaderboard">
                <Button variant="ghost">Leaderboard</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
