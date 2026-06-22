"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../components/CatchStatusBadge";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  cardListShellClass,
  contentStackClass,
  fieldInputClass,
  FormField,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import Link from "next/link";
import { demoCatchHistoryRows, demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { normalizeRole } from "../../../lib/rbac";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");
const API_HISTORY_ME = publicApiUrl("/catches/me");
const API_CATCHES = publicApiUrl("/catches");
const API_TOURNAMENTS = publicApiUrl("/tournaments");

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
  team?: { id: string; name: string } | null;
  media?: { id: string; type: string; url: string; objectKey: string }[];
  reviews?: ReviewRow[];
};

type TournamentOption = { id: string; name: string };

function isTeamRole(role: string): boolean {
  const r = normalizeRole(role);
  return r === "captain" || r === "team_member";
}

function isStaffRole(role: string): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "committee";
}

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
  const [role, setRole] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [tournamentsLoading, setTournamentsLoading] = useState(false);

  const loadTeamHistory = useCallback(async (token: string) => {
    const demo = isDemoMode();
    const res = await fetch(API_HISTORY_ME, {
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
  }, [router]);

  const loadStaffHistory = useCallback(
    async (token: string, tournamentId: string) => {
      if (!tournamentId) {
        setRows([]);
        setError(null);
        return;
      }
      const demo = isDemoMode();
      const url = `${API_CATCHES}?tournamentId=${encodeURIComponent(tournamentId)}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        setError("You do not have access to view all tournament catches.");
        setRows([]);
        return;
      }
      if (!res.ok) {
        if (demo) {
          setError(null);
          setRows(demoCatchHistoryRows() as CatchRow[]);
        } else {
          setError(`Could not load catch history (${res.status}).`);
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
    },
    [router]
  );

  const loadTournaments = useCallback(async (token: string) => {
    setTournamentsLoading(true);
    const demo = isDemoMode();
    try {
      const res = await fetch(API_TOURNAMENTS, {
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
          const list = demoTournamentsList();
          setTournaments(list);
          setSelectedTournamentId((prev) => {
            if (prev && list.some((t) => t.id === prev)) return prev;
            return list[0]?.id ?? "";
          });
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as TournamentOption[]) : [];
      if (list.length === 0 && demo) {
        list = demoTournamentsList();
      }
      setTournaments(list);
      setSelectedTournamentId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch {
      if (demo) {
        const list = demoTournamentsList();
        setTournaments(list);
        setSelectedTournamentId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      }
    } finally {
      setTournamentsLoading(false);
    }
  }, [router]);

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    const demo = isDemoMode();
    let resolvedRole = "";

    try {
      const meRes = await fetch(API_ME, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meRes.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        setError(`Could not load profile (${meRes.status}).`);
        setRows([]);
        return;
      }
      const meJson = (await meRes.json()) as { user?: { role?: string } };
      const userRole = meJson.user?.role != null ? String(meJson.user.role) : "unknown";
      resolvedRole = userRole;
      setRole(userRole);

      if (isStaffRole(userRole)) {
        await loadTournaments(token);
        return;
      }

      if (isTeamRole(userRole)) {
        await loadTeamHistory(token);
        return;
      }

      if (demo) {
        setError(null);
        setRows(demoCatchHistoryRows() as CatchRow[]);
      } else {
        setError("Catch history is not available for your role.");
        setRows([]);
      }
    } catch {
      if (demo) {
        setError(null);
        setRows(demoCatchHistoryRows() as CatchRow[]);
      } else {
        setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setRows([]);
      }
    } finally {
      if (!isStaffRole(resolvedRole)) {
        setLoading(false);
      }
    }
  }, [router, loadTeamHistory, loadTournaments]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!role || !isStaffRole(role)) return;
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) return;

    if (!selectedTournamentId) {
      if (!tournamentsLoading) {
        setLoading(false);
        setRows([]);
      }
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        await loadStaffHistory(token, selectedTournamentId);
      } catch {
        if (!cancelled) {
          if (isDemoMode()) {
            setError(null);
            setRows(demoCatchHistoryRows() as CatchRow[]);
          } else {
            setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
            setRows([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [role, selectedTournamentId, tournamentsLoading, loadStaffHistory]);

  const staffView = role != null && isStaffRole(role);
  const teamView = role != null && isTeamRole(role);
  const showNewCatch = teamView;

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker={staffView ? "Tournament logbook" : "Team logbook"}
        title="Catch history"
        description={
          staffView
            ? "All catch submissions for the selected tournament, including status, scores, and committee notes."
            : "A chronological record of submissions for your crew, including status, scoring line, and committee notes when present."
        }
        aside={
          showNewCatch ? (
            <Link href="/catches/new" className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
              New catch
            </Link>
          ) : undefined
        }
      />

      <div className={contentStackClass}>
        {staffView && tournaments.length > 0 ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Tournament scope</SectionLabel>
            <Card title="Select tournament">
              <FormField label="Catch history for">
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  disabled={tournamentsLoading || loading}
                  className={fieldInputClass}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </Card>
          </div>
        ) : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">Logbook entries</SectionLabel>
          <Card title={staffView ? "All catches" : "Your catches"}>
            {loading || (staffView && tournamentsLoading && tournaments.length === 0) ? (
              <LoadingBlock label="Loading catch history…" />
            ) : error ? (
              <div className="space-y-4">
                <InlineNotice variant="error">{error}</InlineNotice>
                <button type="button" onClick={() => void load()} className={btnGhostClass}>
                  Try again
                </button>
              </div>
            ) : staffView && !selectedTournamentId ? (
              <EmptyState
                title="Select a tournament"
                description="Choose a tournament above to load its full catch history."
              />
            ) : rows.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title="No catches yet"
                  description={
                    staffView
                      ? "No submissions have been recorded for this tournament yet."
                      : "Log your first fish from New catch. Each entry appears here with live status as the committee reviews it."
                  }
                />
                {teamView ? (
                  <InlineNotice variant="info">
                    Tip: attach clear photos or video so verification stays fast during the broadcast window.
                  </InlineNotice>
                ) : null}
              </div>
            ) : (
              <ul className={`divide-y divide-white/[0.06] ${cardListShellClass}`}>
                {rows.map((c) => {
                  const score = scoreLabel(c);
                  const reviews = c.reviews ?? [];
                  return (
                    <li key={c.id} className="px-4 py-5 text-sm first:pt-0 last:pb-0 sm:px-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500">{c.id.slice(0, 8)}…</span>
                            <CatchStatusBadge status={c.status} />
                          </div>
                          {staffView && c.team?.name ? (
                            <p className="mt-2 text-sm font-medium text-slate-100">{c.team.name}</p>
                          ) : null}
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
                          className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-sky-100 transition hover:border-sky-500/30 hover:bg-sky-500/10 ${btnResponsiveClass}`}
                        >
                          Details
                        </Link>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500">
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
