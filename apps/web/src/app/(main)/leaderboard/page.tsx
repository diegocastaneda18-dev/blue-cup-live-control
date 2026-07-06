"use client";

import { Card } from "@bluecup/ui";
import { useCallback, useEffect, useState } from "react";
import { MobilePodiumStrip } from "../../../components/MobileAppUi";
import { EmptyState } from "../../../components/EmptyState";
import {
  BroadcastScore,
  PremiumPanel,
  RankEmblem
} from "../../../components/tournament/PremiumBoardUi";
import {
  btnGhostClass,
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
import { demoLeaderboardForTournament, demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { LEADERBOARD_REFRESH_EVENT } from "../../../lib/liveEvents";

const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_LEADERBOARD = publicApiUrl("/leaderboard");

const POLL_MS = 5000;

type Tournament = {
  id: string;
  name: string;
};

type LeaderboardRow = {
  teamId: string;
  teamName: string;
  pointsPreliminary: number;
  pointsOfficial: number;
};

function scoreForRow(row: LeaderboardRow) {
  return Math.max(row.pointsOfficial ?? 0, row.pointsPreliminary ?? 0);
}

export default function LeaderboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setTournamentsError(null);
    setTournamentsLoading(true);
    const demo = isDemoMode();
    try {
      const res = await fetch(API_TOURNAMENTS, { cache: "no-store" });
      if (!res.ok) {
        if (demo) {
          const list = demoTournamentsList();
          setTournamentsError(null);
          setTournaments(list);
          setSelectedId((prev) => {
            if (prev && list.some((t) => t.id === prev)) return prev;
            return list[0]?.id ?? "";
          });
        } else {
          setTournamentsError(`Could not load tournaments (${res.status}).`);
          setTournaments([]);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as Tournament[]) : [];
      if (list.length === 0 && demo) {
        list = demoTournamentsList();
        setTournamentsError(null);
      }
      setTournaments(list);
      setSelectedId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch {
      if (demo) {
        const list = demoTournamentsList();
        setTournamentsError(null);
        setTournaments(list);
        setSelectedId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      } else {
        setTournamentsError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setTournaments([]);
      }
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  const loadBoard = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (!selectedId) {
        setRows([]);
        setRowsError(null);
        if (!silent) setRowsLoading(false);
        return;
      }
      if (!silent) setRowsLoading(true);
      setRowsError(null);
      const demo = isDemoMode();
      try {
        const url = `${API_LEADERBOARD}?tournamentId=${encodeURIComponent(selectedId)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          if (demo) {
            setRowsError(null);
            setRows(demoLeaderboardForTournament(selectedId));
          } else {
            setRowsError(`Could not load leaderboard (${res.status}).`);
            setRows([]);
          }
          return;
        }
        const data = (await res.json()) as unknown;
        let rows = Array.isArray(data) ? (data as LeaderboardRow[]) : [];
        if (rows.length === 0 && demo) {
          rows = demoLeaderboardForTournament(selectedId);
          setRowsError(null);
        }
        setRows(rows);
      } catch {
        if (demo) {
          setRowsError(null);
          setRows(demoLeaderboardForTournament(selectedId));
        } else {
          setRowsError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
          setRows([]);
        }
      } finally {
        if (!silent) setRowsLoading(false);
      }
    },
    [selectedId]
  );

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    void loadBoard({ silent: false });
  }, [loadBoard]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadTournaments();
      void loadBoard({ silent: true });
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadTournaments, loadBoard]);

  useEffect(() => {
    const handler = () => {
      void loadBoard({ silent: true });
    };
    window.addEventListener(LEADERBOARD_REFRESH_EVENT, handler);
    return () => window.removeEventListener(LEADERBOARD_REFRESH_EVENT, handler);
  }, [loadBoard]);

  const ranked = rows.map((row, i) => ({
    rank: i + 1,
    teamName: row.teamName,
    score: scoreForRow(row)
  }));

  return (
    <PageMain className="max-w-4xl">
      <PageHeader
        kicker="Live scoring"
        title="Leaderboard"
        description="Official tournament standings — refreshed automatically for broadcast-ready visibility."
        aside={
          <>
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Live · 5s
            </span>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-100">
              Official line
            </span>
          </>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? (
          <div className="space-y-3">
            <InlineNotice variant="error">{tournamentsError}</InlineNotice>
            <button type="button" onClick={() => void loadTournaments()} className={`${btnGhostClass} ${btnResponsiveClass}`}>
              Retry loading tournaments
            </button>
          </div>
        ) : null}

        {tournamentsLoading && tournaments.length === 0 && !tournamentsError ? (
          <LoadingBlock label="Loading tournaments…" />
        ) : null}

        {!tournamentsLoading && !tournamentsError && tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments"
            description="Seed the database or create a tournament, then refresh."
          />
        ) : null}

        {tournaments.length > 0 ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Tournament scope</SectionLabel>
            <Card title="Select tournament">
              <FormField label="Active leaderboard">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
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
          <SectionLabel className="mb-3 text-slate-500">Standings</SectionLabel>
          <Card title="Team rankings">
            {rowsLoading ? (
              <LoadingBlock label="Loading standings…" />
            ) : rowsError ? (
              <div className="space-y-3">
                <InlineNotice variant="error">{rowsError}</InlineNotice>
                <button type="button" onClick={() => void loadBoard({ silent: false })} className={`${btnGhostClass} ${btnResponsiveClass}`}>
                  Retry standings
                </button>
              </div>
            ) : !selectedId ? (
              <p className="text-sm leading-relaxed text-slate-400">
                Select a tournament above to load the scoreboard.
              </p>
            ) : ranked.length === 0 ? (
              <EmptyState
                title="No standings yet"
                description="No teams or no scored catches for this tournament yet."
              />
            ) : (
              <>
                {ranked.length >= 3 ? (
                  <MobilePodiumStrip entries={ranked.slice(0, 3)} />
                ) : null}

                {ranked.length >= 3 ? (
                  <div className="mb-6 hidden gap-3 md:grid md:grid-cols-3">
                    {[1, 0, 2].map((idx) => {
                      const r = ranked[idx];
                      if (!r) return null;
                      const isLeader = r.rank === 1;
                      return (
                        <PremiumPanel
                          key={`podium-${r.rank}`}
                          accent="gold"
                          className={`p-4 ${isLeader ? "md:-mt-1 md:pb-5" : "md:mt-2"}`}
                        >
                          <div className="flex flex-col items-center gap-3 text-center">
                            <RankEmblem rank={r.rank} size={isLeader ? "xl" : "lg"} />
                            <div className="min-w-0 w-full">
                              <p className="truncate text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {r.rank === 1 ? "Leader" : r.rank === 2 ? "Runner-up" : "Third place"}
                              </p>
                              <p className="mt-1 truncate text-base font-semibold text-slate-50">{r.teamName}</p>
                            </div>
                            <BroadcastScore score={r.score} size={isLeader ? "lg" : "md"} />
                          </div>
                        </PremiumPanel>
                      );
                    })}
                  </div>
                ) : null}

                <ul className={`divide-y divide-white/[0.06] sm:hidden ${cardListShellClass}`}>
                  {ranked.map((r) => (
                    <li
                      key={`${selectedId}-${r.rank}-${r.teamName}-mobile`}
                      className={`flex items-center gap-3 px-4 py-5 active:bg-white/[0.03] ${r.rank <= 3 ? "bg-white/[0.02]" : ""}`}
                    >
                      <RankEmblem rank={r.rank} size={r.rank <= 3 ? "lg" : "md"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-slate-50">{r.teamName}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {r.rank === 1 ? "Tournament leader" : "Official line"}
                        </p>
                      </div>
                      <BroadcastScore score={r.score} size={r.rank <= 3 ? "lg" : "md"} />
                    </li>
                  ))}
                </ul>

                <div className={`hidden sm:block ${cardListShellClass}`}>
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/[0.08] bg-black/30 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <tr>
                        <th className="w-24 px-5 py-4">Pos</th>
                        <th className="px-5 py-4">Team</th>
                        <th className="px-5 py-4 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {ranked.map((r) => (
                        <tr
                          key={`${selectedId}-${r.rank}-${r.teamName}`}
                          className={`transition hover:bg-white/[0.03] ${r.rank <= 3 ? "bg-gradient-to-r from-white/[0.03] to-transparent" : ""}`}
                        >
                          <td className="px-5 py-4">
                            <RankEmblem rank={r.rank} size="sm" />
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-50">{r.teamName}</p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">Official line</p>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <BroadcastScore score={r.score} size={r.rank <= 3 ? "lg" : "md"} />
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
    </PageMain>
  );
}
