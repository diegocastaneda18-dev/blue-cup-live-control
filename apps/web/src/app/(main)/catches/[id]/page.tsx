"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../../components/CatchStatusBadge";
import { MobileScoreHero } from "../../../../components/MobileAppUi";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  contentStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../../components/PageChrome";
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

function speciesOrCategory(data: CatchDetail) {
  if (data.species) return `${data.species.name} (${data.species.code})`;
  if (data.category) return `${data.category.name} (${data.category.code})`;
  return null;
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
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Catch record"
        title="Catch detail"
        description="Full submission record — status, measurements, media, and committee reviews."
        aside={
          <div className="grid w-full gap-2 sm:w-auto sm:flex sm:flex-wrap">
            <Link href="/catches" className={`${btnGhostClass} ${btnResponsiveClass}`}>
              ← History
            </Link>
            <Link href="/catches/new" className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
              New catch
            </Link>
          </div>
        }
      />

      <div className={contentStackClass}>
        {loading ? (
          <LoadingBlock label="Loading catch…" />
        ) : error ? (
          <InlineNotice variant="error">{error}</InlineNotice>
        ) : !data ? null : (
          <>
            <MobileScoreHero
              status={data.status}
              score={score}
              type={data.type}
              speciesOrCategory={speciesOrCategory(data)}
            />
            <p className="font-mono text-xs text-slate-600">{data.id}</p>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Submission data</SectionLabel>
              <Card title="Summary">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:border-0 sm:bg-transparent sm:p-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                    <dd className="mt-2">
                      <CatchStatusBadge status={data.status} size="lg" />
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:border-0 sm:bg-transparent sm:p-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</dt>
                    <dd className="mt-2 text-base font-semibold capitalize text-slate-100">
                      {data.type.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                    <dd className="mt-1 text-base text-slate-300">{formatWhen(data.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
                    <dd className="mt-1 text-base text-slate-300">{formatWhen(data.updatedAt)}</dd>
                  </div>
                  {(data.weightKg != null || data.lengthCm != null) && (
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Measurements</dt>
                      <dd className="mt-1 text-base text-slate-300">
                        {data.weightKg != null ? `${data.weightKg} kg` : "—"}
                        {data.lengthCm != null ? ` · ${data.lengthCm} cm` : ""}
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Angler notes</dt>
                    <dd className="mt-1 text-base leading-relaxed text-slate-300">
                      {data.notes?.trim() ? data.notes : "—"}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Evidence</SectionLabel>
              <Card title="Media">
                {data.media && data.media.length > 0 ? (
                  <ul className="grid gap-3">
                    {data.media.map((m) => (
                      <li key={m.id}>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition active:scale-[0.99] hover:border-sky-500/25"
                        >
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-amber-100">
                            {m.type}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-sky-300">
                            {m.objectKey || "Open media"}
                          </span>
                          <span className="text-xs text-slate-500">Open →</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No media attached.</p>
                )}
              </Card>
            </div>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Committee</SectionLabel>
              <Card title="Reviews">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No committee reviews yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {reviews.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-base font-semibold capitalize text-slate-100">
                            {r.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-slate-500">{formatWhen(r.createdAt)}</span>
                        </div>
                        {r.reviewer ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {r.reviewer.displayName} · {r.reviewer.email}
                          </p>
                        ) : null}
                        {r.penaltyPoints != null ? (
                          <p className="mt-2 text-sm font-medium text-rose-200/90">
                            Penalty points: {r.penaltyPoints}
                          </p>
                        ) : null}
                        <p className="mt-2 text-base leading-relaxed text-slate-300">
                          {r.notes?.trim() ? r.notes : "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </PageMain>
  );
}
