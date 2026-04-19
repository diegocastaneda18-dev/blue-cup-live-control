"use client";

import { Card } from "@bluecup/ui";
import { EmptyState } from "../../../components/EmptyState";
import {
  cardListShellClass,
  contentStackClass,
  fieldInputClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import { useToast } from "../../../components/Toast";
import { demoTeamsForTournament, demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAMS = publicApiUrl("/teams");

type Tournament = { id: string; name: string };

type TeamMemberRow = {
  userId: string;
  user: { id: string; displayName: string; email: string };
};

type TeamRow = {
  id: string;
  name: string;
  captainUserId: string | null;
  boat: { name: string; registry: string | null } | null;
  members: TeamMemberRow[];
};

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function captainLabel(team: TeamRow) {
  if (!team.captainUserId) return "—";
  const m = team.members?.find((x) => x.userId === team.captainUserId);
  if (m?.user) return `${m.user.displayName} (${m.user.email})`;
  return team.captainUserId;
}

function boatLabel(team: TeamRow) {
  if (!team.boat) return "—";
  const reg = team.boat.registry?.trim();
  return reg ? `${team.boat.name} · ${reg}` : team.boat.name;
}

export default function TeamsPage() {
  const router = useRouter();
  const toast = useToast();
  const [hasToken, setHasToken] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [captainUserId, setCaptainUserId] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshTokenState = useCallback(() => {
    setHasToken(Boolean(typeof window !== "undefined" && localStorage.getItem(ACCESS_TOKEN_KEY)));
  }, []);

  useEffect(() => {
    refreshTokenState();
  }, [refreshTokenState]);

  const loadTournaments = useCallback(async () => {
    setTournamentsError(null);
    setTournamentsLoading(true);
    const demo = isDemoMode();
    try {
      const res = await fetch(API_TOURNAMENTS, {
        cache: "no-store",
        headers: { ...authHeaders() }
      });
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

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    setFormSuccess(null);
    setFormError(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setTeams([]);
      setTeamsError(null);
      return;
    }

    let cancelled = false;
    async function loadTeams() {
      const demo = isDemoMode();
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const url = `${API_TEAMS}/tournament/${encodeURIComponent(selectedId)}`;
        const res = await fetch(url, { cache: "no-store", headers: { ...authHeaders() } });
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          refreshTokenState();
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          if (demo) {
            setTeamsError(null);
            setTeams(demoTeamsForTournament(selectedId));
          } else {
            setTeamsError(`Could not load teams (${res.status}).`);
            setTeams([]);
          }
          return;
        }
        const data = (await res.json()) as unknown;
        let list = Array.isArray(data) ? (data as TeamRow[]) : [];
        if (list.length === 0 && demo) {
          list = demoTeamsForTournament(selectedId);
          setTeamsError(null);
        }
        setTeams(list);
      } catch {
        if (!cancelled) {
          if (demo) {
            setTeamsError(null);
            setTeams(demoTeamsForTournament(selectedId));
          } else {
            setTeamsError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
            setTeams([]);
          }
        }
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    }

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [selectedId, router, refreshTokenState]);

  async function onCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      const msg = "Sign in to create teams (admin account required).";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (!selectedId) {
      const msg = "Select a tournament first.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    const name = newName.trim();
    if (name.length < 2) {
      const msg = "Team name must be at least 2 characters.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setFormPending(true);
    try {
      const body: { tournamentId: string; name: string; captainUserId?: string } = {
        tournamentId: selectedId,
        name
      };
      const cap = captainUserId.trim();
      if (cap) body.captainUserId = cap;

      const res = await fetch(API_TEAMS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const raw = await res.json().catch(() => null) as { message?: string | string[] } | null;
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        refreshTokenState();
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const msg = raw?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        const errMsg = text || `Create failed (${res.status}).`;
        setFormError(errMsg);
        toast.error(errMsg);
        return;
      }
      const okMsg = `Team "${name}" was created and added to this tournament.`;
      setFormSuccess(okMsg);
      toast.success(`Team "${name}" created.`);
      setNewName("");
      setCaptainUserId("");
      const url = `${API_TEAMS}/tournament/${encodeURIComponent(selectedId)}`;
      const listRes = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) {
        const data = (await listRes.json()) as unknown;
        setTeams(Array.isArray(data) ? (data as TeamRow[]) : []);
      }
    } catch {
      const errMsg = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setFormPending(false);
    }
  }

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Fleet roster"
        title="Teams"
        description="Choose a tournament, review registered crews, and add new teams when you are signed in as an administrator."
        aside={
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              hasToken
                ? "border-amber-400/35 bg-amber-500/10 text-amber-100"
                : "border-white/10 bg-white/[0.04] text-slate-400"
            }`}
          >
            {hasToken ? "Write access" : "Read-only"}
          </span>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? <InlineNotice variant="error">{tournamentsError}</InlineNotice> : null}

        {tournamentsLoading && tournaments.length === 0 && !tournamentsError ? (
          <LoadingBlock label="Loading tournaments…" />
        ) : null}

        {!tournamentsLoading && !tournamentsError && tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments"
            description="Seed the database or create a tournament in the API, then refresh."
          />
        ) : null}

        {tournaments.length > 0 ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Tournament scope</SectionLabel>
            <Card title="Select tournament">
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Active roster
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
          <SectionLabel className="mb-3 text-slate-500">Registration</SectionLabel>
          <Card title="Add team">
            {!hasToken ? (
              <InlineNotice variant="info">
                Sign in with an admin account to create teams. You can still browse the roster below.
              </InlineNotice>
            ) : null}
            <form className={`grid gap-5 ${!hasToken ? "mt-4" : ""}`} onSubmit={onCreateTeam}>
              {formError ? (
                <InlineNotice variant="error">{formError}</InlineNotice>
              ) : null}
              {formSuccess ? (
                <InlineNotice variant="success">{formSuccess}</InlineNotice>
              ) : null}
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Team name</span>
                <input
                  required
                  minLength={2}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFormSuccess(null);
                    setFormError(null);
                  }}
                  className={fieldInputClass}
                  placeholder="Azul Dorado"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Captain user ID <span className="font-normal normal-case text-slate-600">(optional)</span>
                </span>
                <input
                  value={captainUserId}
                  onChange={(e) => {
                    setCaptainUserId(e.target.value);
                    setFormSuccess(null);
                    setFormError(null);
                  }}
                  className={fieldInputClass}
                  placeholder="UUID of an existing user"
                />
              </label>

              <button
                type="submit"
                disabled={formPending || !selectedId || !hasToken}
                className="rounded-xl bg-amber-500/90 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-900/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {formPending ? "Creating team…" : "Create team"}
              </button>
            </form>
          </Card>
        </div>

        <div>
          <SectionLabel className="mb-3 text-slate-500">Roster</SectionLabel>
          <Card title="Teams in this tournament">
            {teamsLoading ? (
              <LoadingBlock label="Loading teams…" />
            ) : teamsError ? (
              <InlineNotice variant="error">{teamsError}</InlineNotice>
            ) : !selectedId ? (
              <p className="text-sm leading-relaxed text-slate-400">
                Pick a tournament above to load its registered crews.
              </p>
            ) : teams.length === 0 ? (
              <EmptyState
                title="No teams yet"
                description="Create a team for this tournament using the form above."
              />
            ) : (
              <ul className={`divide-y divide-white/[0.06] ${cardListShellClass}`}>
                {teams.map((team) => (
                  <li key={team.id} className="px-4 py-4 transition hover:bg-white/[0.02] sm:px-5 sm:py-5">
                    <div className="text-base font-semibold tracking-tight text-slate-50">{team.name}</div>
                    <dl className="mt-3 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Captain</dt>
                        <dd className="mt-1 leading-snug text-slate-200">{captainLabel(team)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Boat</dt>
                        <dd className="mt-1 leading-snug text-slate-200">{boatLabel(team)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageMain>
  );
}
