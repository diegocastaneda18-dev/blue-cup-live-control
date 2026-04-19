"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../../components/CatchStatusBadge";
import { demoCatchDetailById, isDemoMode } from "@bluecup/types";
import { publicApiUrl } from "../../../../lib/env";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_CATCH = (id: string) => publicApiUrl(`/catches/${encodeURIComponent(id)}`);

type ReviewRow = {
  id: string;
  action: string;
  notes: string | null;
  penaltyPoints: number | null;
  createdAt: string;
  reviewer?: { displayName: string; email: string };
};

type CatchDetail = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  scorePreliminary: number | null;
  scoreOfficial: number | null;
  category?: { name: string; code: string } | null;
  species?: { name: string; code: string } | null;
  media?: { id: string; type: string; url: string; objectKey: string }[];
  reviews?: ReviewRow[];
};

function scoreLabel(c: CatchDetail) {
  const p = c.scorePreliminary ?? 0;
  const o = c.scoreOfficial ?? 0;
  if (p === 0 && o === 0) return null;
  const max = Math.max(p, o);
  if (p === o) return max.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${max.toLocaleString(undefined, { maximumFractionDigits: 2 })} (prelim ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })} / official ${o.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function CatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<CatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setError("Invalid catch.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CATCH(id), {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (res.status === 404) {
        const demo = isDemoMode();
        const sample = demo ? demoCatchDetailById(id) : null;
        if (sample) {
          setError(null);
          setData(sample as CatchDetail);
        } else {
          setError("Catch not found.");
          setData(null);
        }
        return;
      }
      if (!res.ok) {
        const demo = isDemoMode();
        const sample = demo ? demoCatchDetailById(id) : null;
        if (sample) {
          setError(null);
          setData(sample as CatchDetail);
        } else {
          setError(`Could not load catch (${res.status}).`);
          setData(null);
        }
        return;
      }
      setData((await res.json()) as CatchDetail);
    } catch {
      const demo = isDemoMode();
      const sample = demo && id ? demoCatchDetailById(id) : null;
      if (sample) {
        setError(null);
        setData(sample as CatchDetail);
      } else {
        setError("Could not reach the API.");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const score = data ? scoreLabel(data) : null;
  const reviews = data?.reviews ?? [];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/catches"
          className="text-sm font-medium text-sky-300 hover:text-sky-200"
        >
          ← Back to history
        </Link>
        <Link
          href="/catches/new"
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
        >
          New catch
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400"
              aria-hidden
            />
            <p className="text-sm text-slate-400">Loading catch…</p>
          </div>
        ) : error ? (
          <Card title="Catch">
            <p className="text-sm text-red-100">{error}</p>
          </Card>
        ) : !data ? null : (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Catch detail</h1>
              <CatchStatusBadge status={data.status} size="md" />
            </div>
            <p className="font-mono text-xs text-slate-500">{data.id}</p>

            <Card title="Summary">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
                  <dd className="mt-1 capitalize text-slate-100">{data.type.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</dt>
                  <dd className="mt-1 text-amber-100/90">{score ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                  <dd className="mt-1 text-slate-300">{formatWhen(data.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
                  <dd className="mt-1 text-slate-300">{formatWhen(data.updatedAt)}</dd>
                </div>
                {data.category ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt>
                    <dd className="mt-1 text-slate-200">
                      {data.category.name} <span className="text-slate-500">({data.category.code})</span>
                    </dd>
                  </div>
                ) : null}
                {data.species ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Species</dt>
                    <dd className="mt-1 text-slate-200">
                      {data.species.name} <span className="text-slate-500">({data.species.code})</span>
                    </dd>
                  </div>
                ) : null}
                {(data.weightKg != null || data.lengthCm != null) && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Measurements</dt>
                    <dd className="mt-1 text-slate-300">
                      {data.weightKg != null ? `${data.weightKg} kg` : "—"}
                      {data.lengthCm != null ? ` · ${data.lengthCm} cm` : ""}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Angler notes</dt>
                  <dd className="mt-1 text-slate-300">{data.notes?.trim() ? data.notes : "—"}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Media">
              {data.media && data.media.length > 0 ? (
                <ul className="space-y-3">
                  {data.media.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-amber-100/90">
                        {m.type}
                      </span>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-right text-sm text-sky-300 underline decoration-sky-500/40 hover:text-sky-200"
                      >
                        {m.objectKey}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No media attached.</p>
              )}
            </Card>

            <Card title="Reviews">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No committee reviews yet.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium capitalize text-slate-100">{r.action.replace(/_/g, " ")}</span>
                        <span className="text-xs text-slate-500">{formatWhen(r.createdAt)}</span>
                      </div>
                      {r.reviewer ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {r.reviewer.displayName} · {r.reviewer.email}
                        </p>
                      ) : null}
                      {r.penaltyPoints != null ? (
                        <p className="mt-2 text-xs font-medium text-rose-200/90">Penalty points: {r.penaltyPoints}</p>
                      ) : null}
                      <p className="mt-2 text-slate-300">{r.notes?.trim() ? r.notes : "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
