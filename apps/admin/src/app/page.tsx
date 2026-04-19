"use client";

import Link from "next/link";
import { Card, Button } from "@bluecup/ui";
import { isDemoModeEnabled, resetDemoData } from "@bluecup/types";
import { clearToken, getToken } from "../lib/api";
import { decodeAccessTokenRole } from "../lib/jwtRole";

export default function AdminHomePage() {
  const token = getToken();
  const role = token ? decodeAccessTokenRole(token) : null;
  const showDemoReset = Boolean(token && role === "admin" && isDemoModeEnabled());
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 22, fontWeight: 750 }}>Committee / Admin</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Review workflow, protests, rules, exports</div>
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

      <Card title="Workspaces">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href="/review">
            <Button>Review dashboard</Button>
          </Link>
          <Link href="/protests">
            <Button variant="ghost">Protests</Button>
          </Link>
          <Link href="/audit">
            <Button variant="ghost">Audit log</Button>
          </Link>
          <Link href="/rules">
            <Button variant="ghost">Scoring rules</Button>
          </Link>
        </div>
      </Card>

      {showDemoReset ? (
        <Card
          title="Demo mode"
          right={
            <span
              style={{
                borderRadius: 999,
                border: "1px solid rgba(251, 191, 36, 0.35)",
                background: "rgba(245, 158, 11, 0.12)",
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgb(254, 243, 199)"
              }}
            >
              Admin
            </span>
          }
        >
          <p style={{ margin: 0, color: "#A8B6CC", fontSize: 14, lineHeight: 1.5 }}>
            Reset clears browser keys prefixed with <code style={{ color: "#EAF2FF" }}>bluecup_demo_</code> and
            reloads so the UI returns to a clean demo baseline.
          </p>
          <Button
            onClick={() => {
              window.setTimeout(() => resetDemoData(), 300);
            }}
          >
            Reset demo data
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

