"use client";

import { Card } from "@bluecup/ui";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  cardListShellClass,
  contentStackClass,
  fieldInputClass,
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
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Live scoring"
        title="Leaderboard"
        description="Select a tournament to see ranked teams. Standings refresh automatically every few seconds."
        aside={
          <>
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              Live · 5s refresh
            </span>
            <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200">
              Official line
            </span>
          </>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? (
          <div className="space-y-3">
            <InlineNotice variant="error">{tournamentsError}</InlineNotice>
            <button type="button" onClick={() => void loadTournaments()} className={btnGhostClass}>
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
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Active leaderboard
                </span>
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
              </label>
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
                <button type="button" onClick={() => void loadBoard({ silent: false })} className={btnGhostClass}>
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
              <div className={cardListShellClass}>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.04] text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold text-slate-400">Rank</th>
                      <th className="px-4 py-3.5 font-semibold text-slate-400">Team</th>
                      <th className="px-4 py-3.5 text-right font-semibold text-slate-400">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {ranked.map((r) => (
                      <tr
                        key={`${selectedId}-${r.rank}-${r.teamName}`}
                        className="text-slate-100 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3.5 font-medium tabular-nums text-amber-100/90">{r.rank}</td>
                        <td className="px-4 py-3.5 font-medium">{r.teamName}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-50">
                          {r.score.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageMain>
  );
}
