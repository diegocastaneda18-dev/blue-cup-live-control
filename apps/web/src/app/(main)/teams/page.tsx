"use client";

import { Card } from "@bluecup/ui";
import { EmptyState } from "../../../components/EmptyState";
import { TeamListCard } from "../../../components/teams/TeamProfileView";
import {
  contentStackClass,
  FieldGroup,
  fieldInputClass,
  FormField,
  btnPrimaryClass,
  btnResponsiveClass,
  formStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import { useToast } from "../../../components/Toast";
import { demoLeaderboardForTournament, demoTeamsForTournament, demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAMS = publicApiUrl("/teams");
const API_TEAM_BOAT = publicApiUrl("/teams/boat");

type Tournament = { id: string; name: string };

type TeamMemberRow = {
  userId: string;
  user: { id: string; displayName: string; email: string };
};

type TeamRow = {
  id: string;
  name: string;
  captainUserId: string | null;
  usesSonar?: boolean;
  boat: { name: string; registry: string | null } | null;
  members: TeamMemberRow[];
};

function scoreForLeaderboardRow(row: { pointsOfficial: number; pointsPreliminary: number }) {
  return Math.max(row.pointsOfficial ?? 0, row.pointsPreliminary ?? 0);
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  const [scoreByTeamId, setScoreByTeamId] = useState<Record<string, number>>({});

  const [newName, setNewName] = useState("");
  const [captainUserId, setCaptainUserId] = useState("");
  const [newBoatName, setNewBoatName] = useState("");
  const [newBoatRegistry, setNewBoatRegistry] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBoatWarning, setFormBoatWarning] = useState<string | null>(null);

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
    setFormBoatWarning(null);
    setNewBoatName("");
    setNewBoatRegistry("");
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
        const lbUrl = `${publicApiUrl("/leaderboard")}?tournamentId=${encodeURIComponent(selectedId)}`;
        fetch(lbUrl, { cache: "no-store" })
          .then(async (lbRes) => {
            if (!lbRes.ok && demo) {
              const lb = demoLeaderboardForTournament(selectedId);
              const map: Record<string, number> = {};
              for (const r of lb) map[r.teamId] = scoreForLeaderboardRow(r);
              setScoreByTeamId(map);
              return;
            }
            if (lbRes.ok) {
              const lb = (await lbRes.json()) as {
                teamId: string;
                pointsOfficial: number;
                pointsPreliminary: number;
              }[];
              const map: Record<string, number> = {};
              for (const r of lb) map[r.teamId] = scoreForLeaderboardRow(r);
              setScoreByTeamId(map);
            }
          })
          .catch(() => setScoreByTeamId({}));
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

  async function refreshTeamsList(token: string, tournamentId: string) {
    const url = `${API_TEAMS}/tournament/${encodeURIComponent(tournamentId)}`;
    const listRes = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
    if (listRes.ok) {
      const data = (await listRes.json()) as unknown;
      setTeams(Array.isArray(data) ? (data as TeamRow[]) : []);
    }
  }

  async function onCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    setFormBoatWarning(null);
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
      const raw = (await res.json().catch(() => null)) as { id?: string; message?: string | string[] } | null;
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
      const teamId = raw?.id;
      if (!teamId) {
        const errMsg = "Team was created but the response had no id; boat details were not saved.";
        setFormError(errMsg);
        toast.error(errMsg);
        await refreshTeamsList(token, selectedId);
        return;
      }

      let boatWarning: string | null = null;
      const boatName = newBoatName.trim();
      const boatRegistry = newBoatRegistry.trim();
      if (boatName.length >= 2) {
        const boatBody: { teamId: string; name: string; registry?: string } = {
          teamId,
          name: boatName
        };
        if (boatRegistry) boatBody.registry = boatRegistry;
        const boatRes = await fetch(API_TEAM_BOAT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(boatBody)
        });
        const boatRaw = (await boatRes.json().catch(() => null)) as { message?: string | string[] } | null;
        if (boatRes.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          refreshTokenState();
          router.replace("/login");
          return;
        }
        if (!boatRes.ok) {
          const msg = boatRaw?.message;
          const text = Array.isArray(msg) ? msg.join(" ") : msg;
          boatWarning = `The team was saved, but the boat could not be saved: ${text || boatRes.status}. Use “Edit boat” in the roster below to try again.`;
        }
      } else if (boatName.length > 0 && boatName.length < 2) {
        boatWarning =
          "The team was saved, but the boat was not saved: boat name must be at least 2 characters. Use “Edit boat” in the roster to add boat details.";
      }

      const okMsg = `Team "${name}" was created and added to this tournament.`;
      setFormSuccess(okMsg);
      setFormBoatWarning(boatWarning);
      if (boatWarning) {
        toast.success(`Team "${name}" created.`);
      } else if (boatName.length >= 2) {
        toast.success(`Team "${name}" created with boat details.`);
      } else {
        toast.success(`Team "${name}" created.`);
      }
      setNewName("");
      setCaptainUserId("");
      setNewBoatName("");
      setNewBoatRegistry("");
      await refreshTeamsList(token, selectedId);
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
        description="Official tournament team files — open any crew profile for scores, vessel details, roster, and catch activity."
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
              <FormField label="Active roster">
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
          <SectionLabel className="mb-3 text-slate-500">Registered teams</SectionLabel>
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
              description="Create a team for this tournament using the form below."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <TeamListCard
                  key={team.id}
                  team={team}
                  tournamentId={selectedId}
                  generalScore={scoreByTeamId[team.id] ?? null}
                />
              ))}
            </div>
          )}
        </div>

        {hasToken ? (
        <div>
          <SectionLabel className="mb-3 text-slate-500">Admin registration</SectionLabel>
          <Card title="Add team">
            <form className={formStackClass} onSubmit={onCreateTeam}>
              {formError ? (
                <InlineNotice variant="error">{formError}</InlineNotice>
              ) : null}
              {formSuccess ? (
                <InlineNotice variant="success">{formSuccess}</InlineNotice>
              ) : null}
              {formBoatWarning ? (
                <InlineNotice variant="warning">{formBoatWarning}</InlineNotice>
              ) : null}

              <FormField label="Team name">
                <input
                  required
                  minLength={2}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setFormSuccess(null);
                    setFormError(null);
                    setFormBoatWarning(null);
                  }}
                  className={fieldInputClass}
                  placeholder="Azul Dorado"
                />
              </FormField>

              <FormField label="Captain user ID" optional hint="UUID of an existing user, if known.">
                <input
                  value={captainUserId}
                  onChange={(e) => {
                    setCaptainUserId(e.target.value);
                    setFormSuccess(null);
                    setFormError(null);
                    setFormBoatWarning(null);
                  }}
                  className={fieldInputClass}
                  placeholder="UUID of an existing user"
                />
              </FormField>

              <FieldGroup title="Boat details" description="Optional — add now or edit from the team profile.">
                <FormField label="Boat name" optional>
                  <input
                    value={newBoatName}
                    onChange={(e) => {
                      setNewBoatName(e.target.value);
                      setFormSuccess(null);
                      setFormError(null);
                      setFormBoatWarning(null);
                    }}
                    className={fieldInputClass}
                    placeholder="Sea Hunter"
                  />
                </FormField>
                <FormField label="Registry / hull ID" optional>
                  <input
                    value={newBoatRegistry}
                    onChange={(e) => {
                      setNewBoatRegistry(e.target.value);
                      setFormSuccess(null);
                      setFormError(null);
                      setFormBoatWarning(null);
                    }}
                    className={fieldInputClass}
                    placeholder="e.g. documentation number"
                  />
                </FormField>
              </FieldGroup>

              <button
                type="submit"
                disabled={formPending || !selectedId || !hasToken}
                className={`${btnPrimaryClass} ${btnResponsiveClass}`}
              >
                {formPending ? "Creating team…" : "Create team"}
              </button>
            </form>
          </Card>
        </div>
        ) : null}
      </div>
    </PageMain>
  );
}
