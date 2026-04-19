"use client";

import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { TournamentsPreview } from "../components/TournamentsPreview";

export default function PublicHomePage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: "#C9A24A", fontSize: 12, fontWeight: 800, letterSpacing: 1.1 }}>
          LAS MARÍAS BLUE CUP
        </div>
        <div style={{ color: "#EAF2FF", fontSize: 28, fontWeight: 850 }}>Live Leaderboard</div>
        <div style={{ color: "#A8B6CC" }}>
          Tournament-grade real-time standings. Preliminary vs official clearly separated.
        </div>
      </div>

      <Card title="Navigate">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/leaderboard">
            <Button>Live leaderboard</Button>
          </Link>
          <Link href="/highlights">
            <Button variant="ghost">Highlights feed</Button>
          </Link>
          <Link href="/results">
            <Button variant="ghost">Official results</Button>
          </Link>
        </div>
      </Card>

      <TournamentsPreview />
    </div>
  );
}

