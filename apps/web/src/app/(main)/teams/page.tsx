"use client";

import { Card } from "@bluecup/ui";
import { EmptyState } from "../../../components/EmptyState";
import {
  cardListShellClass,
  contentStackClass,
  FieldGroup,
  fieldInputClass,
  FormField,
  btnGhostClass,
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
import { dispatchLeaderboardRefresh } from "../../../lib/liveEvents";
import { normalizeRole } from "../../../lib/rbac";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAMS = publicApiUrl("/teams");
const API_TEAM_BOAT = publicApiUrl("/teams/boat");
const API_LEADERBOARD = publicApiUrl("/leaderboard");

type Tournament = { id: string; name: string };

type TeamMemberRow = {
  userId: string;
  user: { id: string; displayName: string; email: string };
};

type TeamRow = {
  id: string;
  name: string;
  captainUserId: string | null;
  manualScoreAdjustment?: number;
  manualScoreReason?: string | null;
  manualScoreUpdatedAt?: string | null;
  manualScoreUpdatedBy?: { displayName: string; email: string } | null;
  boat: { name: string; registry: string | null } | null;
  members: TeamMemberRow[];
};

type ScoreRow = {
  teamId: string;
  automaticScore: number;
  manualScoreAdjustment: number;
  finalScore: number;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAdmin = normalizeRole(userRole) === "admin";

  const [scoreByTeam, setScoreByTeam] = useState<Record<string, ScoreRow>>({});

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [captainUserId, setCaptainUserId] = useState("");
  const [newBoatName, setNewBoatName] = useState("");
  const [newBoatRegistry, setNewBoatRegistry] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBoatWarning, setFormBoatWarning] = useState<string | null>(null);

  const [editingBoatTeamId, setEditingBoatTeamId] = useState<string | null>(null);
  const [editBoatName, setEditBoatName] = useState("");
  const [editBoatRegistry, setEditBoatRegistry] = useState("");
  const [boatEditPending, setBoatEditPending] = useState(false);
  const [boatEditError, setBoatEditError] = useState<string | null>(null);

  const [editingScoreTeamId, setEditingScoreTeamId] = useState<string | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState("");
  const [scoreReason, setScoreReason] = useState("");
  const [scoreEditPending, setScoreEditPending] = useState(false);
  const [scoreEditError, setScoreEditError] = useState<string | null>(null);

  const refreshTokenState = useCallback(() => {
    setHasToken(Boolean(typeof window !== "undefined" && localStorage.getItem(ACCESS_TOKEN_KEY)));
  }, []);

  useEffect(() => {
    refreshTokenState();
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(API_ME, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = (await res.json()) as { user?: { role?: string } };
          setUserRole(json.user?.role != null ? String(json.user.role) : null);
        }
      } catch {
        /* ignore */
      }
    })();
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
    setEditingBoatTeamId(null);
    setBoatEditError(null);
    setEditingScoreTeamId(null);
    setScoreEditError(null);
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

  useEffect(() => {
    if (!selectedId) {
      setScoreByTeam({});
      return;
    }
    let cancelled = false;
    async function loadScores() {
      const demo = isDemoMode();
      try {
        const url = `${API_LEADERBOARD}?tournamentId=${encodeURIComponent(selectedId)}`;
        const res = await fetch(url, { cache: "no-store", headers: { ...authHeaders() } });
        if (cancelled) return;
        if (!res.ok) {
          if (demo) {
            const rows = demoLeaderboardForTournament(selectedId);
            const map: Record<string, ScoreRow> = {};
            for (const r of rows) {
              map[r.teamId] = {
                teamId: r.teamId,
                automaticScore: r.automaticScore,
                manualScoreAdjustment: r.manualScoreAdjustment,
                finalScore: r.finalScore
              };
            }
            setScoreByTeam(map);
          }
          return;
        }
        const data = (await res.json()) as unknown;
        const rows = Array.isArray(data)
          ? (data as {
              teamId: string;
              automaticScore?: number;
              manualScoreAdjustment?: number;
              finalScore?: number;
              pointsPreliminary?: number;
              pointsOfficial?: number;
            }[])
          : [];
        const map: Record<string, ScoreRow> = {};
        for (const r of rows) {
          map[r.teamId] = {
            teamId: r.teamId,
            automaticScore: r.automaticScore ?? r.pointsPreliminary ?? 0,
            manualScoreAdjustment: r.manualScoreAdjustment ?? 0,
            finalScore: r.finalScore ?? r.pointsOfficial ?? 0
          };
        }
        setScoreByTeam(map);
      } catch {
        if (!cancelled && demo) {
          const rows = demoLeaderboardForTournament(selectedId);
          const map: Record<string, ScoreRow> = {};
          for (const r of rows) {
            map[r.teamId] = {
              teamId: r.teamId,
              automaticScore: r.automaticScore,
              manualScoreAdjustment: r.manualScoreAdjustment,
              finalScore: r.finalScore
            };
          }
          setScoreByTeam(map);
        }
      }
    }
    void loadScores();
    return () => {
      cancelled = true;
    };
  }, [selectedId, teams]);

  async function refreshTeamsList(token: string, tournamentId: string) {
    const url = `${API_TEAMS}/tournament/${encodeURIComponent(tournamentId)}`;
    const listRes = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
    if (listRes.ok) {
      const data = (await listRes.json()) as unknown;
      setTeams(Array.isArray(data) ? (data as TeamRow[]) : []);
    }
  }

  async function saveBoatForTeam(teamId: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      setBoatEditError("Sign in to save boat details.");
      return;
    }
    const name = editBoatName.trim();
    if (name.length < 2) {
      setBoatEditError("Boat name must be at least 2 characters.");
      return;
    }
    const reg = editBoatRegistry.trim();
    setBoatEditPending(true);
    setBoatEditError(null);
    try {
      const body: { teamId: string; name: string; registry?: string } = { teamId, name };
      if (reg) body.registry = reg;
      const res = await fetch(API_TEAM_BOAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const raw = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        refreshTokenState();
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const msg = raw?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        setBoatEditError(text || `Boat save failed (${res.status}).`);
        return;
      }
      toast.success("Boat details saved.");
      setEditingBoatTeamId(null);
      await refreshTeamsList(token, selectedId);
    } catch {
      setBoatEditError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
    } finally {
      setBoatEditPending(false);
    }
  }

  async function saveManualScore(teamId: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      setScoreEditError("Sign in to adjust scores.");
      return;
    }
    const reason = scoreReason.trim();
    if (reason.length < 3) {
      setScoreEditError("A reason of at least 3 characters is required.");
      return;
    }
    const raw = scoreAdjustment.trim();
    if (raw.length === 0) {
      setScoreEditError("Enter an adjustment amount (use 0 to clear a prior adjustment).");
      return;
    }
    const adjustment = Number(raw);
    if (Number.isNaN(adjustment)) {
      setScoreEditError("Adjustment must be a valid number.");
      return;
    }

    setScoreEditPending(true);
    setScoreEditError(null);
    try {
      const res = await fetch(`${API_TEAMS}/${encodeURIComponent(teamId)}/manual-score`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adjustment, reason })
      });
      const rawJson = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        refreshTokenState();
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const msg = rawJson?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        setScoreEditError(text || `Score adjustment failed (${res.status}).`);
        return;
      }
      toast.success("Manual score adjustment saved.");
      setEditingScoreTeamId(null);
      setScoreAdjustment("");
      setScoreReason("");
      dispatchLeaderboardRefresh();
      await refreshTeamsList(token, selectedId);
      const url = `${API_LEADERBOARD}?tournamentId=${encodeURIComponent(selectedId)}`;
      const lbRes = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (lbRes.ok) {
        const data = (await lbRes.json()) as unknown;
        const rows = Array.isArray(data)
          ? (data as {
              teamId: string;
              automaticScore?: number;
              manualScoreAdjustment?: number;
              finalScore?: number;
              pointsPreliminary?: number;
              pointsOfficial?: number;
            }[])
          : [];
        const map: Record<string, ScoreRow> = {};
        for (const r of rows) {
          map[r.teamId] = {
            teamId: r.teamId,
            automaticScore: r.automaticScore ?? r.pointsPreliminary ?? 0,
            manualScoreAdjustment: r.manualScoreAdjustment ?? 0,
            finalScore: r.finalScore ?? r.pointsOfficial ?? 0
          };
        }
        setScoreByTeam(map);
      }
    } catch {
      setScoreEditError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
    } finally {
      setScoreEditPending(false);
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
          <SectionLabel className="mb-3 text-slate-500">Registration</SectionLabel>
          <Card title="Add team">
            {!hasToken ? (
              <InlineNotice variant="info">
                Sign in with an admin account to create teams. You can still browse the roster below.
              </InlineNotice>
            ) : null}
            <form className={`${formStackClass} ${!hasToken ? "mt-4" : ""}`} onSubmit={onCreateTeam}>
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

              <FieldGroup title="Boat details" description="Optional — add now or edit from the roster below.">
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
                      {scoreByTeam[team.id] ? (
                        <>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Automatic score
                            </dt>
                            <dd className="mt-1 tabular-nums text-slate-200">
                              {scoreByTeam[team.id].automaticScore.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Final score
                            </dt>
                            <dd className="mt-1 tabular-nums font-medium text-amber-100/90">
                              {scoreByTeam[team.id].finalScore.toLocaleString(undefined, {
                                maximumFractionDigits: 1
                              })}
                              {(team.manualScoreAdjustment ?? scoreByTeam[team.id].manualScoreAdjustment) !== 0 ? (
                                <span className="ml-2 text-xs font-normal text-slate-500">
                                  (adj{" "}
                                  {(team.manualScoreAdjustment ?? scoreByTeam[team.id].manualScoreAdjustment) > 0
                                    ? "+"
                                    : ""}
                                  {(team.manualScoreAdjustment ?? scoreByTeam[team.id].manualScoreAdjustment).toLocaleString(
                                    undefined,
                                    { maximumFractionDigits: 1 }
                                  )}
                                  )
                                </span>
                              ) : null}
                            </dd>
                          </div>
                        </>
                      ) : null}
                    </dl>
                    {team.manualScoreReason?.trim() ? (
                      <p className="mt-3 text-xs leading-relaxed text-slate-500">
                        Last adjustment: {team.manualScoreReason}
                        {team.manualScoreUpdatedBy
                          ? ` · ${team.manualScoreUpdatedBy.displayName}`
                          : null}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasToken ? (
                        <button
                          type="button"
                          className={`${btnGhostClass} ${btnResponsiveClass} text-xs sm:text-sm`}
                          onClick={() => {
                            setBoatEditError(null);
                            if (editingBoatTeamId === team.id) {
                              setEditingBoatTeamId(null);
                            } else {
                              setEditingBoatTeamId(team.id);
                              setEditBoatName(team.boat?.name ?? "");
                              setEditBoatRegistry(team.boat?.registry ?? "");
                            }
                          }}
                        >
                          {editingBoatTeamId === team.id ? "Close boat" : team.boat ? "Edit boat" : "Add boat"}
                        </button>
                      ) : null}
                      {isAdmin && hasToken ? (
                        <button
                          type="button"
                          className={`${btnGhostClass} ${btnResponsiveClass} text-xs sm:text-sm`}
                          onClick={() => {
                            setScoreEditError(null);
                            if (editingScoreTeamId === team.id) {
                              setEditingScoreTeamId(null);
                            } else {
                              setEditingScoreTeamId(team.id);
                              setScoreAdjustment(
                                String(team.manualScoreAdjustment ?? scoreByTeam[team.id]?.manualScoreAdjustment ?? 0)
                              );
                              setScoreReason(team.manualScoreReason ?? "");
                            }
                          }}
                        >
                          {editingScoreTeamId === team.id ? "Close score" : "Adjust score"}
                        </button>
                      ) : null}
                    </div>
                    {editingScoreTeamId === team.id && isAdmin && hasToken ? (
                      <form
                        className="mt-4 grid gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveManualScore(team.id);
                        }}
                      >
                        {scoreEditError ? <InlineNotice variant="error">{scoreEditError}</InlineNotice> : null}
                        <p className="text-xs leading-relaxed text-slate-400">
                          Manual adjustments are added to the automatic catch score. They do not overwrite raw catch
                          totals and are stored with your user id for audit.
                        </p>
                        <label className="grid gap-2 text-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Adjustment (+/−)
                          </span>
                          <input
                            required
                            type="number"
                            step="any"
                            value={scoreAdjustment}
                            onChange={(e) => setScoreAdjustment(e.target.value)}
                            className={fieldInputClass}
                            placeholder="e.g. -10 or 25"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Reason (required)
                          </span>
                          <textarea
                            required
                            minLength={3}
                            rows={3}
                            value={scoreReason}
                            onChange={(e) => setScoreReason(e.target.value)}
                            className={`${fieldInputClass} resize-y`}
                            placeholder="Explain why this adjustment is being applied…"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={scoreEditPending}
                          className={`${btnPrimaryClass} ${btnResponsiveClass}`}
                        >
                          {scoreEditPending ? "Saving…" : "Save score adjustment"}
                        </button>
                      </form>
                    ) : null}
                    {editingBoatTeamId === team.id && hasToken ? (
                      <form
                        className="mt-4 grid gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveBoatForTeam(team.id);
                        }}
                      >
                        {boatEditError ? <InlineNotice variant="error">{boatEditError}</InlineNotice> : null}
                        <label className="grid gap-2 text-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Boat name
                          </span>
                          <input
                            required
                            minLength={2}
                            value={editBoatName}
                            onChange={(e) => setEditBoatName(e.target.value)}
                            className={fieldInputClass}
                            placeholder="Sea Hunter"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Registry / hull ID <span className="font-normal normal-case text-slate-600">(optional)</span>
                          </span>
                          <input
                            value={editBoatRegistry}
                            onChange={(e) => setEditBoatRegistry(e.target.value)}
                            className={fieldInputClass}
                            placeholder="e.g. documentation number"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={boatEditPending}
                          className={`${btnPrimaryClass} ${btnResponsiveClass}`}
                        >
                          {boatEditPending ? "Saving…" : "Save boat"}
                        </button>
                      </form>
                    ) : null}
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
