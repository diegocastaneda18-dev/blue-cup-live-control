"use client";

import { Card } from "@bluecup/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  BroadcastScore,
  MetaChip,
  PremiumPanel,
  RankEmblem,
  SectionDivider,
  StatusPill
} from "../../../components/tournament/PremiumBoardUi";
import { demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { LEADERBOARD_REFRESH_EVENT } from "../../../lib/liveEvents";

const API_TOURNAMENTS = publicApiUrl("/tournaments");
const ACCESS_TOKEN_KEY = "accessToken";
const POLL_MS = 5000;

type Tournament = { id: string; name: string };
type JackpotCategory = "sonar" | "non_sonar";

const ALL_CATEGORIES: JackpotCategory[] = ["sonar", "non_sonar"];

type JackpotStandingRow = {
  rank: number;
  teamId: string;
  teamName: string;
  day: string;
  category: JackpotCategory;
  releaseScore: number;
  isEligible: boolean;
};

type JackpotTierBoard = {
  tierId: string;
  name: string;
  amountUsd: number;
  sortOrder: number;
  entry: JackpotStandingRow | null;
};

type JackpotLeaderboardResponse = {
  tournamentId: string;
  category: JackpotCategory;
  day: string;
  tiers: JackpotTierBoard[];
  standings: JackpotStandingRow[];
};

type EligibilityRow = {
  teamId: string;
  teamName: string;
  usesSonar: boolean;
  category: JackpotCategory;
  isEligible: boolean;
  approvedAt: string | null;
  approvedBy: { displayName: string; email: string } | null;
};

const CATEGORY_TABS: { id: JackpotCategory; label: string; short: string }[] = [
  { id: "sonar", label: "Sonar", short: "Sonar" },
  { id: "non_sonar", label: "Non Sonar", short: "Non Sonar" }
];

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatDayLabel(day: string) {
  const d = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return day;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(d);
}

function formatLastUpdated(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(d);
}

function getCategoryLeader(board: JackpotLeaderboardResponse | undefined) {
  return board?.standings[0] ?? null;
}

function getTopTier(board: JackpotLeaderboardResponse | undefined) {
  return board?.tiers.find((t) => t.sortOrder === 1) ?? board?.tiers[0] ?? null;
}

async function fetchJackpotBoard(
  tournamentId: string,
  category: JackpotCategory,
  day: string
): Promise<JackpotLeaderboardResponse | null> {
  const url = `${publicApiUrl("/jackpots/leaderboard")}?tournamentId=${encodeURIComponent(tournamentId)}&category=${encodeURIComponent(category)}&day=${encodeURIComponent(day)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as JackpotLeaderboardResponse;
}

function CategoryLeaderCard({
  tab,
  board,
  isActive,
  onSelect
}: {
  tab: (typeof CATEGORY_TABS)[number];
  board: JackpotLeaderboardResponse | undefined;
  isActive: boolean;
  onSelect: () => void;
}) {
  const leader = getCategoryLeader(board);
  const topTier = getTopTier(board);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left transition ${isActive ? "ring-1 ring-amber-400/35" : "opacity-90 hover:opacity-100"}`}
    >
      <PremiumPanel accent="gold" className="h-full p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">{tab.short} leader</p>
          {isActive ? <StatusPill tone="gold">Live view</StatusPill> : null}
        </div>

        {leader ? (
          <>
            <p className="mt-3 truncate text-xl font-bold text-slate-50 sm:text-2xl">{leader.teamName}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Day total score</p>
                <BroadcastScore score={leader.releaseScore} size="lg" />
              </div>
              {topTier ? (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Top tier</p>
                  <p className="text-sm font-bold text-amber-100">{formatUsd(topTier.amountUsd)}</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            No eligible competitor yet for {tab.label} on this day.
          </p>
        )}
      </PremiumPanel>
    </button>
  );
}

export default function JackpotsPage() {
  const [role, setRole] = useState<string>("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [category, setCategory] = useState<JackpotCategory>("sonar");
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [boardsByCategory, setBoardsByCategory] = useState<
    Partial<Record<JackpotCategory, JackpotLeaderboardResponse>>
  >({});
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);

  const [eligibility, setEligibility] = useState<EligibilityRow[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [eligibilityNotice, setEligibilityNotice] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const board = boardsByCategory[category];

  const loadTournaments = useCallback(async () => {
    setTournamentsError(null);
    setTournamentsLoading(true);
    const demo = isDemoMode();
    try {
      const res = await fetch(API_TOURNAMENTS, { cache: "no-store", headers: authHeaders() });
      if (!res.ok) {
        if (demo) {
          const list = demoTournamentsList();
          setTournaments(list);
          setSelectedTournamentId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0]?.id ?? ""));
        } else {
          setTournamentsError(`Could not load tournaments (${res.status}).`);
          setTournaments([]);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as Tournament[]) : [];
      if (list.length === 0 && demo) list = demoTournamentsList();
      setTournaments(list);
      setSelectedTournamentId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0]?.id ?? ""));
    } catch {
      if (demo) {
        const list = demoTournamentsList();
        setTournaments(list);
        setSelectedTournamentId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0]?.id ?? ""));
      } else {
        setTournamentsError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setTournaments([]);
      }
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  const loadRole = useCallback(async () => {
    try {
      const res = await fetch(publicApiUrl("/auth/me"), { cache: "no-store", headers: authHeaders() });
      if (!res.ok) return;
      const json = (await res.json()) as { user?: { role?: string } };
      setRole((json.user?.role ?? "").trim().toLowerCase());
    } catch {
      setRole("");
    }
  }, []);

  const loadDays = useCallback(async () => {
    if (!selectedTournamentId) {
      setDays([]);
      setSelectedDay("");
      return;
    }
    try {
      const lists = await Promise.all(
        ALL_CATEGORIES.map(async (cat) => {
          const url = `${publicApiUrl("/jackpots/days")}?tournamentId=${encodeURIComponent(selectedTournamentId)}&category=${encodeURIComponent(cat)}`;
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) return [] as string[];
          return (await res.json()) as string[];
        })
      );
      const merged = [...new Set(lists.flat())].sort();
      setDays(merged);
      setSelectedDay((prev) => (prev && merged.includes(prev) ? prev : merged[merged.length - 1] ?? ""));
    } catch {
      setDays([]);
      setSelectedDay("");
    }
  }, [selectedTournamentId]);

  const loadAllBoards = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!selectedTournamentId || !selectedDay) {
        setBoardsByCategory({});
        setBoardError(null);
        if (!silent) setBoardLoading(false);
        return;
      }
      if (!silent) setBoardLoading(true);
      else setIsLiveRefreshing(true);
      setBoardError(null);
      try {
        const results = await Promise.all(
          ALL_CATEGORIES.map(async (cat) => {
            const data = await fetchJackpotBoard(selectedTournamentId, cat, selectedDay);
            return { cat, data };
          })
        );
        const anyOk = results.some((r) => r.data != null);
        if (!anyOk) {
          setBoardError(`Could not load jackpots leaderboard.`);
          setBoardsByCategory({});
          return;
        }
        const next: Partial<Record<JackpotCategory, JackpotLeaderboardResponse>> = {};
        for (const { cat, data } of results) {
          if (data) next[cat] = data;
        }
        setBoardsByCategory(next);
        setLastUpdatedAt(new Date());
      } catch {
        setBoardError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setBoardsByCategory({});
      } finally {
        if (!silent) setBoardLoading(false);
        setIsLiveRefreshing(false);
      }
    },
    [selectedTournamentId, selectedDay]
  );

  const loadEligibility = useCallback(async () => {
    if (!isAdmin || !selectedTournamentId) {
      setEligibility([]);
      return;
    }
    setEligibilityLoading(true);
    setEligibilityError(null);
    try {
      const url = `${publicApiUrl("/jackpots/eligibility")}?tournamentId=${encodeURIComponent(selectedTournamentId)}&category=${encodeURIComponent(category)}`;
      const res = await fetch(url, { cache: "no-store", headers: authHeaders() });
      if (!res.ok) {
        setEligibilityError(`Could not load eligibility (${res.status}).`);
        setEligibility([]);
        return;
      }
      setEligibility((await res.json()) as EligibilityRow[]);
    } catch {
      setEligibilityError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
      setEligibility([]);
    } finally {
      setEligibilityLoading(false);
    }
  }, [isAdmin, selectedTournamentId, category]);

  useEffect(() => {
    void loadRole();
    void loadTournaments();
  }, [loadRole, loadTournaments]);

  useEffect(() => {
    void loadDays();
  }, [loadDays]);

  useEffect(() => {
    void loadAllBoards({ silent: false });
  }, [loadAllBoards]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadAllBoards({ silent: true });
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadAllBoards]);

  useEffect(() => {
    const handler = () => {
      void loadAllBoards({ silent: true });
    };
    window.addEventListener(LEADERBOARD_REFRESH_EVENT, handler);
    return () => window.removeEventListener(LEADERBOARD_REFRESH_EVENT, handler);
  }, [loadAllBoards]);

  async function toggleEligibility(teamId: string, next: boolean) {
    if (!selectedTournamentId) return;
    setEligibilityNotice(null);
    try {
      const res = await fetch(publicApiUrl("/jackpots/eligibility"), {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          teamId,
          category,
          isEligible: next
        })
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
        const msg = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
        setEligibilityNotice(msg || `Update failed (${res.status}).`);
        return;
      }
      setEligibilityNotice(next ? "Team marked jackpot-eligible." : "Team removed from jackpot visibility.");
      await loadEligibility();
      await loadAllBoards({ silent: true });
    } catch {
      setEligibilityNotice("Could not update eligibility.");
    }
  }

  async function toggleTeamSonar(teamId: string, usesSonar: boolean) {
    setEligibilityNotice(null);
    try {
      const res = await fetch(publicApiUrl(`/jackpots/teams/${encodeURIComponent(teamId)}/sonar`), {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ usesSonar })
      });
      if (!res.ok) {
        setEligibilityNotice(`Could not update equipment category (${res.status}).`);
        return;
      }
      setEligibilityNotice(usesSonar ? "Team moved to Sonar category." : "Team moved to Non Sonar category.");
      await loadEligibility();
      await loadDays();
      await loadAllBoards({ silent: true });
    } catch {
      setEligibilityNotice("Could not update equipment category.");
    }
  }

  const categoryLabel = useMemo(
    () => CATEGORY_TABS.find((t) => t.id === category)?.label ?? category,
    [category]
  );

  const activeLeader = getCategoryLeader(board);
  const activeTopTier = getTopTier(board);

  return (
    <PageMain className="max-w-5xl">
      <PageHeader
        kicker="Live jackpot board"
        title="Jackpots"
        description="Dedicated live purse leaderboard — separate from the general tournament standings. Approved release scores by day, admin eligibility required."
        aside={
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
              Live · {POLL_MS / 1000}s
            </span>
            {lastUpdatedAt ? (
              <span className="text-[11px] text-slate-500">
                {isLiveRefreshing ? "Refreshing… · " : null}
                Updated {formatLastUpdated(lastUpdatedAt)}
              </span>
            ) : null}
          </div>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? <InlineNotice variant="error">{tournamentsError}</InlineNotice> : null}

        <PremiumPanel accent="gold" className="p-4 sm:p-5">
          <SectionDivider label="Live scope" />
          <div className="mt-5 grid gap-5">
            {tournamentsLoading ? (
              <LoadingBlock label="Loading tournaments…" />
            ) : (
              <FormField label="Tournament">
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className={fieldInputClass}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Competition day">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className={`${fieldInputClass} font-medium`}
                disabled={days.length === 0}
              >
                {days.length === 0 ? <option value="">No approved release days yet</option> : null}
                {days.map((day) => (
                  <option key={day} value={day}>
                    {formatDayLabel(day)}
                  </option>
                ))}
              </select>
            </FormField>

            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Focus category
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`min-h-12 flex-1 rounded-xl px-4 text-sm font-bold transition sm:min-w-[9rem] ${
                        active
                          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 ring-1 ring-amber-300/50"
                          : "border border-white/[0.12] bg-black/20 text-slate-200 hover:border-amber-400/25 hover:bg-amber-500/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PremiumPanel>

        {selectedDay ? (
          <div>
            <SectionDivider label="Current leaders" />
            <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
              {formatDayLabel(selectedDay)} · tap a card to focus that category
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {CATEGORY_TABS.map((tab) => (
                <CategoryLeaderCard
                  key={tab.id}
                  tab={tab}
                  board={boardsByCategory[tab.id]}
                  isActive={category === tab.id}
                  onSelect={() => setCategory(tab.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeLeader && selectedDay ? (
          <PremiumPanel accent="gold" className="overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-5 py-6 sm:px-6 sm:py-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200/90">
                {categoryLabel} · day leader
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <RankEmblem rank={1} size="xl" />
                    <p className="truncate text-2xl font-bold text-slate-50 sm:text-3xl">{activeLeader.teamName}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Leading the {categoryLabel} jackpot purse for {formatDayLabel(selectedDay)}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Accumulated score</p>
                    <BroadcastScore score={activeLeader.releaseScore} size="xl" />
                  </div>
                  {activeTopTier ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Top tier purse</p>
                      <p className="text-2xl font-bold text-amber-100">{formatUsd(activeTopTier.amountUsd)}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </PremiumPanel>
        ) : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">
            {categoryLabel} prize tiers · live
          </SectionLabel>
          {boardError ? <InlineNotice variant="error">{boardError}</InlineNotice> : null}
          {boardLoading ? (
            <LoadingBlock label="Loading live jackpot board…" />
          ) : !board || board.tiers.length === 0 ? (
            <EmptyState
              title="No tiers configured"
              description="Jackpot tiers for this tournament and category will appear here once configured by admin."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {board.tiers.map((tier) => {
                const isTop = tier.sortOrder === 1;
                return (
                  <PremiumPanel
                    key={tier.tierId}
                    accent="gold"
                    className={`flex flex-col p-5 ${isTop ? "ring-1 ring-amber-400/25" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Tier {tier.sortOrder}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-300">{tier.name}</p>
                      </div>
                      <span className="shrink-0 rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/20 to-amber-600/5 px-3 py-2 text-lg font-bold tabular-nums text-amber-100">
                        {formatUsd(tier.amountUsd)}
                      </span>
                    </div>

                    {tier.entry ? (
                      <div className="mt-5 flex flex-1 flex-col gap-4 border-t border-white/[0.06] pt-5">
                        <div className="flex items-center gap-3">
                          <RankEmblem rank={tier.entry.rank} size={isTop ? "lg" : "md"} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Tier leader
                            </p>
                            <p className="truncate text-lg font-bold text-slate-50">{tier.entry.teamName}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Day score
                            </p>
                            <BroadcastScore score={tier.entry.releaseScore} size={isTop ? "lg" : "md"} />
                          </div>
                          <StatusPill tone="success">Eligible</StatusPill>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-5 border-t border-white/[0.06] pt-5 text-sm leading-relaxed text-slate-500">
                        Open tier — no eligible team has claimed this purse slot yet today.
                      </p>
                    )}
                  </PremiumPanel>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <SectionDivider label={`${categoryLabel} live standings`} />
          <div className="mt-5">
            <Card title={`${categoryLabel} · ${selectedDay ? formatDayLabel(selectedDay) : "—"}`}>
              {!board || board.standings.length === 0 ? (
                <EmptyState
                  title="No competitors yet"
                  description="Only admin-approved eligible teams with approved release catches appear on this live jackpot board."
                />
              ) : (
                <>
                  <ul className={`divide-y divide-white/[0.06] sm:hidden ${cardListShellClass}`}>
                    {board.standings.map((row) => (
                      <li
                        key={row.teamId}
                        className={`flex items-center gap-3 px-4 py-5 active:bg-white/[0.03] ${row.rank === 1 ? "bg-amber-500/[0.08]" : row.rank <= 3 ? "bg-white/[0.02]" : ""}`}
                      >
                        <RankEmblem rank={row.rank} size={row.rank <= 3 ? "lg" : "md"} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-bold text-slate-50">{row.teamName}</p>
                          <StatusPill tone="success">Eligible</StatusPill>
                        </div>
                        <BroadcastScore score={row.releaseScore} size={row.rank === 1 ? "xl" : row.rank <= 3 ? "lg" : "md"} />
                      </li>
                    ))}
                  </ul>
                  <div className={`hidden overflow-x-auto sm:block ${cardListShellClass}`}>
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-white/[0.08] bg-black/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Rank</th>
                          <th className="px-5 py-4">Team</th>
                          <th className="hidden px-5 py-4 md:table-cell">Day</th>
                          <th className="px-5 py-4 text-right">Day score</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {board.standings.map((row) => (
                          <tr
                            key={row.teamId}
                            className={`transition hover:bg-white/[0.03] ${row.rank === 1 ? "bg-amber-500/[0.06]" : row.rank <= 3 ? "bg-white/[0.02]" : ""}`}
                          >
                            <td className="px-5 py-4">
                              <RankEmblem rank={row.rank} size="sm" />
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-50">{row.teamName}</td>
                            <td className="hidden px-5 py-4 text-slate-400 md:table-cell">
                              {formatDayLabel(row.day)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <BroadcastScore score={row.releaseScore} size={row.rank === 1 ? "lg" : "md"} />
                            </td>
                            <td className="px-5 py-4">
                              <StatusPill tone="success">Eligible</StatusPill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        {isAdmin ? (
          <div>
            <SectionDivider label="Admin controls" />
            <div className="mt-5">
              <PremiumPanel accent="sky" className="p-4 sm:p-5">
                <h3 className="text-base font-semibold text-slate-50">Jackpot eligibility</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">
                  Committee approves catches; only admins control which teams appear on jackpot leaderboards. Assign
                  equipment category (Sonar / Non Sonar) before approving eligibility.
                </p>
                {eligibilityNotice ? (
                  <div className="mb-4">
                    <InlineNotice variant="info">{eligibilityNotice}</InlineNotice>
                  </div>
                ) : null}
                {eligibilityError ? <InlineNotice variant="error">{eligibilityError}</InlineNotice> : null}
                {eligibilityLoading ? (
                  <LoadingBlock label="Loading teams…" />
                ) : eligibility.length === 0 ? (
                  <EmptyState
                    title="No teams in category"
                    description="Teams registered for this equipment category will appear here for eligibility management."
                  />
                ) : (
                  <ul className="mt-4 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/20">
                    {eligibility.map((row) => (
                      <li
                        key={row.teamId}
                        className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-50">{row.teamName}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <MetaChip>{row.usesSonar ? "Sonar" : "Non Sonar"}</MetaChip>
                            <StatusPill tone={row.isEligible ? "success" : "warning"}>
                              {row.isEligible ? "Jackpot eligible" : "Not eligible"}
                            </StatusPill>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
                          <button
                            type="button"
                            className={`${btnGhostClass} ${btnResponsiveClass} text-xs`}
                            onClick={() => void toggleTeamSonar(row.teamId, !row.usesSonar)}
                          >
                            Set {row.usesSonar ? "Non Sonar" : "Sonar"}
                          </button>
                          <button
                            type="button"
                            className={`${row.isEligible ? btnGhostClass : btnPrimaryClass} ${btnResponsiveClass} text-xs`}
                            onClick={() => void toggleEligibility(row.teamId, !row.isEligible)}
                          >
                            {row.isEligible ? "Revoke eligibility" : "Approve for jackpots"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PremiumPanel>
            </div>
          </div>
        ) : null}
      </div>
    </PageMain>
  );
}
