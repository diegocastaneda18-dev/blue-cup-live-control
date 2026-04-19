"use client";

import { Card } from "@bluecup/ui";

export default function NotificationsPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Notifications</div>
      <Card title="MVP">
        <div style={{ color: "#A8B6CC" }}>
          Notification delivery is scaffolded in the database and backend, but the MVP UI doesn’t yet render live notifications.
        </div>
      </Card>
    </div>
  );
}

