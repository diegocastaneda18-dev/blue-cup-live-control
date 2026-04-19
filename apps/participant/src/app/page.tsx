"use client";

import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { clearToken, getToken } from "./lib/token";

export default function HomePage() {
  const token = getToken();
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 750 }}>Blue Cup Live Control</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Participant portal — Las Marías Blue Cup</div>
        </div>
        {token ? (
          <Button variant="ghost" onClick={() => clearToken()}>
            Sign out
          </Button>
        ) : (
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        )}
      </div>

      <Card title="Quick actions">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/team">
            <Button variant="ghost">Team dashboard</Button>
          </Link>
          <Link href="/submit-catch">
            <Button>Submit catch</Button>
          </Link>
          <Link href="/history">
            <Button variant="ghost">Catch history</Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
          <Link href="/notifications">
            <Button variant="ghost">Notifications</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

