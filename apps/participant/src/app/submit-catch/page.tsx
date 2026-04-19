"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@bluecup/ui";
import { apiFetch } from "../../lib/api";

export default function SubmitCatchPage() {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState("00000000-0000-0000-0000-000000000001");
  const [categoryId, setCategoryId] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [type, setType] = useState<"release" | "weigh_in">("release");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Submit catch</div>
        <div style={{ color: "#A8B6CC", marginTop: 4 }}>
          MVP note: paste IDs (categories/species come from admin seed). We’ll wire pickers next.
        </div>
      </div>

      <Card title="Catch details">
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Tournament ID" value={tournamentId} onChange={setTournamentId} />
          <Input label="Category ID" value={categoryId} onChange={setCategoryId} placeholder="e.g. Release category uuid" />
          <Input label="Species ID (optional)" value={speciesId} onChange={setSpeciesId} />

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ color: "#A8B6CC", fontSize: 12, fontWeight: 600 }}>Catch type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.18)",
                color: "#EAF2FF",
                outline: "none"
              }}
            >
              <option value="release">Release</option>
              <option value="weigh_in">Weigh-in</option>
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Weight (kg, optional)" value={weightKg} onChange={setWeightKg} placeholder="e.g. 14.2" />
            <Input label="Length (cm, optional)" value={lengthCm} onChange={setLengthCm} placeholder="e.g. 98" />
          </div>
          <Input label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Evidence notes, conditions…" />

          {error ? <div style={{ color: "#ffb4b4", fontSize: 13 }}>{error}</div> : null}
          {createdId ? (
            <div style={{ color: "#A8B6CC", fontSize: 13 }}>
              Submitted. Catch ID: <b style={{ color: "#EAF2FF" }}>{createdId}</b>
            </div>
          ) : null}

          <Button
            onClick={async () => {
              setError(null);
              setCreatedId(null);
              try {
                const res = await apiFetch<{ id: string }>("/catches", {
                  method: "POST",
                  body: JSON.stringify({
                    tournamentId,
                    categoryId,
                    speciesId: speciesId || undefined,
                    type,
                    weightKg: weightKg ? Number(weightKg) : undefined,
                    lengthCm: lengthCm ? Number(lengthCm) : undefined,
                    notes: notes || undefined
                  })
                });
                setCreatedId(res.id);
              } catch (e: any) {
                setError(e?.details?.message ?? "Submit failed");
              }
            }}
          >
            Submit for review
          </Button>

          <Button variant="ghost" onClick={() => router.push("/team")}>
            Back to dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}

