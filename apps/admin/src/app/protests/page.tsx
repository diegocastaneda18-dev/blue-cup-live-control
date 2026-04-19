"use client";

import { Card } from "@bluecup/ui";

export default function ProtestsPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Protest management</div>
      <Card title="MVP">
        <div style={{ color: "#A8B6CC" }}>Protest workflow is in the schema; UI and endpoints are next on the roadmap.</div>
      </Card>
    </div>
  );
}

