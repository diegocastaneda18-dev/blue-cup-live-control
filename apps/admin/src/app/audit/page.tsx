"use client";

import { Card } from "@bluecup/ui";

export default function AuditPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Audit log</div>
      <Card title="MVP">
        <div style={{ color: "#A8B6CC" }}>
          Audit logs are written by the API for login, tournament/team edits, catch submissions, and committee decisions. Next step: add an admin endpoint + UI table to query them.
        </div>
      </Card>
    </div>
  );
}

