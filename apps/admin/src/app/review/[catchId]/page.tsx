"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Input } from "@bluecup/ui";
import { apiFetch } from "../../../lib/api";

export default function ReviewDetailPage() {
  const params = useParams<{ catchId: string }>();
  const router = useRouter();
  const catchId = params.catchId;
  const [notes, setNotes] = useState("");
  const [penaltyPoints, setPenaltyPoints] = useState("0");
  const [catchRow, setCatchRow] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // MVP: we reuse pending list (no single-catch endpoint yet)
  useEffect(() => {
    setCatchRow({ id: catchId });
  }, [catchId]);

  async function act(action: "approve" | "reject" | "request_more_evidence" | "penalize") {
    setError(null);
    try {
      await apiFetch(`/committee/catches/${encodeURIComponent(catchId)}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          notes: notes || undefined,
          penaltyPoints: action === "penalize" ? Number(penaltyPoints) : undefined
        })
      });
      router.push("/review");
    } catch (e: any) {
      setError(e?.details?.message ?? "Action failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Catch review</div>
          <div style={{ color: "#A8B6CC", marginTop: 4 }}>Catch ID: {catchId}</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/review")}>
          Back
        </Button>
      </div>

      {error ? <Card title="Error">{error}</Card> : null}

      <Card title="Decision">
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Decision reasoning…" />
          <Input
            label="Penalty points (only for penalize)"
            value={penaltyPoints}
            onChange={setPenaltyPoints}
            placeholder="e.g. 50"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Button onClick={() => act("approve")}>Approve</Button>
            <Button variant="ghost" onClick={() => act("request_more_evidence")}>
              Request more evidence
            </Button>
            <Button variant="ghost" onClick={() => act("penalize")}>
              Penalize
            </Button>
            <Button variant="ghost" onClick={() => act("reject")}>
              Reject
            </Button>
          </div>
        </div>
      </Card>

      <Card title="MVP note">
        <div style={{ color: "#A8B6CC" }}>
          The detail view will show media previews + scoring rule context next. For now, actions are wired end-to-end to the API.
        </div>
      </Card>
    </div>
  );
}

