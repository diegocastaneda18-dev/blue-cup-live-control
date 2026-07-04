"use client";

import { Card } from "@bluecup/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";

const API_TOURNAMENTS = publicApiUrl("/tournaments");
const ACCESS_TOKEN_KEY = "accessToken";

type Tournament = { id: string; name: string };
type JackpotCategory = "sonar" | "non_sonar";

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

const CATEGORY_TABS: { id: JackpotCategory; label: string }[] = [
  { id: "sonar", label: "Sonar" },
  { id: "non_sonar", label: "Non Sonar" }
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

export default function JackpotsPage() {
  const [role, setRole] = useState<string>("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [category, setCategory] = useState<JackpotCategory>("sonar");
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [board, setBoard] = useState<JackpotLeaderboardResponse | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [eligibility, setEligibility] = useState<EligibilityRow[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [eligibilityNotice, setEligibilityNotice] = useState<string | null>(null);

  const isAdmin = role === "admin";

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
      const url = `${publicApiUrl("/jackpots/days")}?tournamentId=${encodeURIComponent(selectedTournamentId)}&category=${encodeURIComponent(category)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setDays([]);
        setSelectedDay("");
        return;
      }
      const list = (await res.json()) as string[];
      setDays(list);
      setSelectedDay((prev) => (prev && list.includes(prev) ? prev : list[list.length - 1] ?? ""));
    } catch {
      setDays([]);
      setSelectedDay("");
    }
  }, [selectedTournamentId, category]);

  const loadBoard = useCallback(async () => {
    if (!selectedTournamentId || !selectedDay) {
      setBoard(null);
      setBoardError(null);
      setBoardLoading(false);
      return;
    }
    setBoardLoading(true);
    setBoardError(null);
    try {
      const url = `${publicApiUrl("/jackpots/leaderboard")}?tournamentId=${encodeURIComponent(selectedTournamentId)}&category=${encodeURIComponent(category)}&day=${encodeURIComponent(selectedDay)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setBoardError(`Could not load jackpots leaderboard (${res.status}).`);
        setBoard(null);
        return;
      }
      setBoard((await res.json()) as JackpotLeaderboardResponse);
    } catch {
      setBoardError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
      setBoard(null);
    } finally {
      setBoardLoading(false);
    }
  }, [selectedTournamentId, category, selectedDay]);

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
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

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
      await loadBoard();
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
      await loadBoard();
    } catch {
      setEligibilityNotice("Could not update equipment category.");
    }
  }

  const categoryLabel = useMemo(
    () => CATEGORY_TABS.find((t) => t.id === category)?.label ?? category,
    [category]
  );

  return (
    <PageMain className="max-w-5xl">
      <PageHeader
        kicker="Daily prizes"
        title="Jackpots"
        description="Separate from the general tournament leaderboard. Rankings use approved release scores by tournament day, filtered by Sonar or Non Sonar equipment category and admin eligibility."
        aside={
          <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100">
            {categoryLabel}
          </span>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? <InlineNotice variant="error">{tournamentsError}</InlineNotice> : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">Scope</SectionLabel>
          <Card title="Tournament & category">
            <div className="grid gap-4">
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

              <div className="flex flex-wrap gap-2">
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${
                        active
                          ? "bg-amber-500/90 text-slate-950 shadow-md shadow-amber-950/30"
                          : "border border-white/[0.12] bg-white/[0.04] text-slate-100 hover:border-sky-500/25 hover:bg-sky-500/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <FormField label="Tournament day">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={fieldInputClass}
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
            </div>
          </Card>
        </div>

        <div>
          <SectionLabel className="mb-3 text-slate-500">Daily jackpot tiers</SectionLabel>
          {boardError ? <InlineNotice variant="error">{boardError}</InlineNotice> : null}
          {boardLoading ? (
            <LoadingBlock label="Loading jackpot standings…" />
          ) : !board || board.tiers.length === 0 ? (
            <Card title="No tiers configured">
              <p className="text-sm leading-relaxed text-slate-400">
                Configure jackpot tiers for this tournament and category in the database seed or admin tooling.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {board.tiers.map((tier) => (
                <Card
                  key={tier.tierId}
                  title={tier.name}
                  right={
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                      {formatUsd(tier.amountUsd)}
                    </span>
                  }
                >
                  {tier.entry ? (
                    <dl className="grid gap-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rank</dt>
                        <dd className="mt-1 text-slate-100">#{tier.entry.rank}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Team</dt>
                        <dd className="mt-1 font-medium text-slate-50">{tier.entry.teamName}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Approved release score
                        </dt>
                        <dd className="mt-1 text-amber-100/90">
                          {tier.entry.releaseScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Eligibility</dt>
                        <dd className="mt-1 text-emerald-200">Admin approved</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-slate-500">No eligible team yet for this tier on the selected day.</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionLabel className="mb-3 text-slate-500">Daily standings</SectionLabel>
          <Card title={`${categoryLabel} · ${selectedDay ? formatDayLabel(selectedDay) : "—"}`}>
            {!board || board.standings.length === 0 ? (
              <p className="text-sm text-slate-500">
                Only admin-approved teams with approved release catches appear here.
              </p>
            ) : (
              <div className={`overflow-x-auto ${cardListShellClass}`}>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/[0.08] bg-black/20 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Rank</th>
                      <th className="px-4 py-3 font-semibold">Team</th>
                      <th className="px-4 py-3 font-semibold">Day</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Release score</th>
                      <th className="px-4 py-3 font-semibold">Eligibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.standings.map((row) => (
                      <tr key={row.teamId} className="border-b border-white/[0.06]">
                        <td className="px-4 py-3 font-mono text-amber-100/90">#{row.rank}</td>
                        <td className="px-4 py-3 font-medium text-slate-50">{row.teamName}</td>
                        <td className="px-4 py-3 text-slate-300">{formatDayLabel(row.day)}</td>
                        <td className="px-4 py-3 capitalize text-slate-300">{row.category.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-amber-100/90">
                          {row.releaseScore.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-emerald-200">Approved</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {isAdmin ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Admin controls</SectionLabel>
            <Card title="Jackpot eligibility">
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
                <p className="text-sm text-slate-500">No teams in this category yet.</p>
              ) : (
                <ul className={`divide-y divide-white/[0.06] ${cardListShellClass}`}>
                  {eligibility.map((row) => (
                    <li key={row.teamId} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-50">{row.teamName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Equipment: {row.usesSonar ? "Sonar" : "Non Sonar"} · Eligible:{" "}
                          {row.isEligible ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
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
            </Card>
          </div>
        ) : null}
      </div>
    </PageMain>
  );
}
