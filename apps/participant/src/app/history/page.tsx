"use client";

import { useEffect, useState } from "react";
import { Card } from "@bluecup/ui";
import { demoCatchHistoryRows, isDemoModeEnabled } from "@bluecup/types";
import { apiFetch } from "../../lib/api";

export default function HistoryPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any[]>("/catches/me")
      .then((res) => {
        if (Array.isArray(res) && res.length === 0 && isDemoModeEnabled()) {
          setRows(demoCatchHistoryRows());
        } else {
          setRows(res);
        }
        setError(null);
      })
      .catch((e: any) => {
        if (isDemoModeEnabled()) {
          setRows(demoCatchHistoryRows());
          setError(null);
        } else {
          setError(e?.details?.message ?? "Failed to load history");
        }
      });
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Catch history</div>
      {error ? <Card title="Error">{error}</Card> : null}
      <Card title="Latest">
        <div style={{ display: "grid", gap: 10 }}>
          {(rows ?? []).map((c) => (
            <div key={c.id} style={{ display: "grid", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b>
                  {c.category?.name} · {c.type}
                </b>
                <span style={{ color: "#A8B6CC" }}>{c.status}</span>
              </div>
              <div style={{ color: "#A8B6CC", fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</div>
              {c.media?.length ? <div style={{ color: "#A8B6CC", fontSize: 12 }}>media: {c.media.length}</div> : null}
            </div>
          ))}
          {rows && rows.length === 0 ? <div style={{ color: "#A8B6CC" }}>No catches yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}

