"use client";

import Link from "next/link";
import { Card, Button } from "@bluecup/ui";

export default function HighlightsPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 850 }}>Highlights</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Curated catch moments and evidence</div>
        </div>
        <Link href="/leaderboard">
          <Button variant="ghost">Leaderboard</Button>
        </Link>
      </div>

      <Card title="MVP">
        <div style={{ color: "#A8B6CC" }}>
          Highlights feed is a public read-only view of approved catches with featured media. It’s planned in the roadmap; backend endpoints come after basic exports/audit log browsing.
        </div>
      </Card>
    </div>
  );
}

