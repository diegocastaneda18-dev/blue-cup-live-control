"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@bluecup/ui";
import { apiFetch } from "../../lib/api";
import { setToken } from "../lib/token";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("captain.dorado@bluecup.local");
  const [password, setPassword] = useState("BlueCup123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <Card title="Participant sign-in" right={<div style={{ color: "#A8B6CC", fontSize: 12 }}>Las Marías Blue Cup</div>}>
          <form
            style={{ display: "grid", gap: 12 }}
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              try {
                const res = await apiFetch<{ accessToken: string }>("/auth/login", {
                  method: "POST",
                  body: JSON.stringify({ email, password })
                });
                setToken(res.accessToken);
                router.push("/team");
              } catch (err: any) {
                setError(err?.details?.message ?? "Login failed");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Password" value={password} onChange={setPassword} type="password" />
            {error ? <div style={{ color: "#ffb4b4", fontSize: 13 }}>{error}</div> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

