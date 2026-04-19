"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../components/CatchStatusBadge";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  cardListShellClass,
  contentStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import Link from "next/link";
import { demoCatchHistoryRows, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_HISTORY = publicApiUrl("/catches/me");

type ReviewRow = {
  id: string;
  action: string;
  notes: string | null;
  penaltyPoints: number | null;
  createdAt: string;
  reviewer?: { displayName: string; email: string };
};

type CatchRow = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  scorePreliminary?: number | null;
  scoreOfficial?: number | null;
  category?: { name: string; code: string } | null;
  species?: { name: string; code: string } | null;
  media?: { id: string; type: string; url: string; objectKey: string }[];
  reviews?: ReviewRow[];
};

function scoreLabel(c: CatchRow) {
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

export default function CatchesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    const demo = isDemoMode();
    try {
      const res = await fetch(API_HISTORY, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        if (demo) {
          setError(null);
          setRows(demoCatchHistoryRows() as CatchRow[]);
        } else {
          setError(`Could not load history (${res.status}).`);
          setRows([]);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as CatchRow[]) : [];
      if (list.length === 0 && demo) {
        list = demoCatchHistoryRows() as CatchRow[];
        setError(null);
      }
      setRows(list);
    } catch {
      if (demo) {
        setError(null);
        setRows(demoCatchHistoryRows() as CatchRow[]);
      } else {
        setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Team logbook"
        title="Catch history"
        description="A chronological record of submissions for your crew, including status, scoring line, and committee notes when present."
        aside={
          <Link href="/catches/new" className={btnGhostClass}>
            New catch
          </Link>
        }
      />

      <div className={contentStackClass}>
        <div>
          <SectionLabel className="mb-3 text-slate-500">Logbook entries</SectionLabel>
          <Card title="Your catches">
            {loading ? (
              <LoadingBlock label="Loading catch history…" />
            ) : error ? (
              <div className="space-y-4">
                <InlineNotice variant="error">{error}</InlineNotice>
                <button type="button" onClick={() => void load()} className={btnGhostClass}>
                  Try again
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title="No catches yet"
                  description="Log your first fish from New catch. Each entry appears here with live status as the committee reviews it."
                />
                <InlineNotice variant="info">
                  Tip: attach clear photos or video so verification stays fast during the broadcast window.
                </InlineNotice>
              </div>
            ) : (
              <ul className={`divide-y divide-white/[0.06] ${cardListShellClass}`}>
              {rows.map((c) => {
                const score = scoreLabel(c);
                const reviews = c.reviews ?? [];
                return (
                  <li key={c.id} className="py-5 text-sm first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-500">{c.id.slice(0, 8)}…</span>
                          <CatchStatusBadge status={c.status} />
                        </div>
                        <div className="mt-2 text-[15px] leading-snug text-slate-200">
                          <span className="font-medium capitalize text-slate-50">{c.type.replace(/_/g, " ")}</span>
                          {c.category ? (
                            <span className="text-slate-400">
                              {" "}
                              · {c.category.name}{" "}
                              <span className="text-slate-500">({c.category.code})</span>
                            </span>
                          ) : null}
                          {c.species ? (
                            <span className="text-slate-400">
                              {" "}
                              · {c.species.name}{" "}
                              <span className="text-slate-500">({c.species.code})</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Link
                        href={`/catches/${c.id}`}
                        className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-500/30 hover:bg-sky-500/10"
                      >
                        Details
                      </Link>
                    </div>

                    <div className="mt-3 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                      <span>
                        <span className="text-slate-600">Created</span> {formatWhen(c.createdAt)}
                      </span>
                      <span>
                        <span className="text-slate-600">Updated</span> {formatWhen(c.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      {score ? (
                        <span className="text-slate-300">
                          Score: <span className="font-semibold text-amber-100/90">{score}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">Score: —</span>
                      )}
                      {c.media && c.media.length > 0 ? (
                        <span className="text-slate-400">{c.media.length} media file(s)</span>
                      ) : (
                        <span className="text-slate-600">No media</span>
                      )}
                      {reviews.length > 0 ? (
                        <span className="text-slate-400">{reviews.length} review(s)</span>
                      ) : null}
                    </div>

                    {c.media && c.media.length > 0 ? (
                      <div className="mt-4 border-t border-white/[0.06] pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Media</p>
                        <ul className="mt-2 space-y-2">
                          {c.media.map((m) => (
                            <li key={m.id} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-amber-100/90">
                                {m.type}
                              </span>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-sky-300 underline decoration-sky-500/40 hover:text-sky-200"
                              >
                                {m.objectKey || "Open link"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {reviews.length > 0 ? (
                      <div className="mt-4 border-t border-white/[0.06] pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Latest review
                        </p>
                        {(() => {
                          const r = reviews[0];
                          if (!r) return null;
                          return (
                            <div className="mt-2 rounded-xl border border-white/[0.08] bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-300">
                              <div className="flex flex-wrap gap-2 text-slate-400">
                                <span className="font-medium text-slate-200">{r.action.replace(/_/g, " ")}</span>
                                {r.penaltyPoints != null ? (
                                  <span className="text-rose-200/90">Penalty: {r.penaltyPoints} pts</span>
                                ) : null}
                                <span>{formatWhen(r.createdAt)}</span>
                              </div>
                              {r.notes?.trim() ? (
                                <p className="mt-1 text-slate-300">{r.notes}</p>
                              ) : (
                                <p className="mt-1 text-slate-600">No review notes.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </li>
                );
              })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageMain>
  );
}
