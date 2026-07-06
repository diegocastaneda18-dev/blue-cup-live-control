"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TeamProfileView, type TeamProfileData } from "../../../../components/teams/TeamProfileView";
import {
  btnGhostClass,
  contentStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain
} from "../../../../components/PageChrome";
import { useToast } from "../../../../components/Toast";
import { demoLeaderboardForTournament, demoTeamsForTournament, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../../lib/env";

const ACCESS_TOKEN_KEY = "accessToken";
const API_TEAM_BOAT = publicApiUrl("/teams/boat");

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function scoreForLeaderboardRow(row: { pointsOfficial: number; pointsPreliminary: number }) {
  return Math.max(row.pointsOfficial ?? 0, row.pointsPreliminary ?? 0);
}

function demoProfileFromList(teamId: string, tournamentId: string): TeamProfileData | null {
  const team = demoTeamsForTournament(tournamentId).find((t) => t.id === teamId);
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    captainUserId: team.captainUserId,
    usesSonar: false,
    tournamentId,
    boat: team.boat,
    tournament: { id: tournamentId, name: "Las Marías Showcase (demo)", isActive: true },
    members: team.members.map((m) => ({
      userId: m.userId,
      roleLabel: "Angler",
      user: { ...m.user, role: "team_member" }
    })),
    jackpotEligibilities: [],
    catchStats: { total: 3, submitted: 1, pending: 1, approved: 1, rejected: 0 }
  };
}

async function fetchJackpotScore(
  tournamentId: string,
  teamId: string,
  usesSonar: boolean
): Promise<number | null> {
  const category = usesSonar ? "sonar" : "non_sonar";
  try {
    const daysUrl = `${publicApiUrl("/jackpots/days")}?tournamentId=${encodeURIComponent(tournamentId)}&category=${encodeURIComponent(category)}`;
    const daysRes = await fetch(daysUrl, { cache: "no-store" });
    if (!daysRes.ok) return null;
    const days = (await daysRes.json()) as string[];
    const day = days[days.length - 1];
    if (!day) return null;
    const boardUrl = `${publicApiUrl("/jackpots/leaderboard")}?tournamentId=${encodeURIComponent(tournamentId)}&category=${encodeURIComponent(category)}&day=${encodeURIComponent(day)}`;
    const boardRes = await fetch(boardUrl, { cache: "no-store" });
    if (!boardRes.ok) return null;
    const board = (await boardRes.json()) as { standings: { teamId: string; releaseScore: number }[] };
    const row = board.standings.find((s) => s.teamId === teamId);
    return row?.releaseScore ?? null;
  } catch {
    return null;
  }
}

export default function TeamProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useToast();
  const teamId = typeof params.teamId === "string" ? params.teamId : "";

  const [profile, setProfile] = useState<TeamProfileData | null>(null);
  const [generalScore, setGeneralScore] = useState<number | null>(null);
  const [jackpotScore, setJackpotScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [editingBoat, setEditingBoat] = useState(false);
  const [editBoatName, setEditBoatName] = useState("");
  const [editBoatRegistry, setEditBoatRegistry] = useState("");
  const [boatEditPending, setBoatEditPending] = useState(false);
  const [boatEditError, setBoatEditError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    const demo = isDemoMode();
    const tournamentIdFromQuery = searchParams.get("tournamentId") ?? "";

    try {
      const res = await fetch(publicApiUrl(`/teams/${encodeURIComponent(teamId)}/profile`), {
        cache: "no-store",
        headers: authHeaders()
      });
      if (!res.ok) {
        if (demo && tournamentIdFromQuery) {
          const demoProfile = demoProfileFromList(teamId, tournamentIdFromQuery);
          if (demoProfile) {
            setProfile(demoProfile);
            const lb = demoLeaderboardForTournament(tournamentIdFromQuery);
            const row = lb.find((r) => r.teamId === teamId);
            setGeneralScore(row ? scoreForLeaderboardRow(row) : null);
            setJackpotScore(null);
            return;
          }
        }
        setError(`Could not load team profile (${res.status}).`);
        setProfile(null);
        return;
      }

      const data = (await res.json()) as TeamProfileData;
      setProfile(data);

      const tid = data.tournamentId;
      const lbRes = await fetch(`${publicApiUrl("/leaderboard")}?tournamentId=${encodeURIComponent(tid)}`, {
        cache: "no-store"
      });
      if (lbRes.ok) {
        const lb = (await lbRes.json()) as {
          teamId: string;
          pointsOfficial: number;
          pointsPreliminary: number;
        }[];
        const row = lb.find((r) => r.teamId === teamId);
        setGeneralScore(row ? scoreForLeaderboardRow(row) : null);
      } else {
        setGeneralScore(null);
      }

      setJackpotScore(await fetchJackpotScore(tid, teamId, data.usesSonar));
    } catch {
      setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, searchParams]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(publicApiUrl("/auth/me"), { cache: "no-store", headers: authHeaders() });
        if (!res.ok) return;
        const json = (await res.json()) as { user?: { role?: string; teamId?: string } };
        setIsAdmin((json.user?.role ?? "").toLowerCase() === "admin");
        if (json.user?.teamId) setMyTeamId(json.user.teamId);
        else {
          const dashRes = await fetch(publicApiUrl("/teams/me/dashboard"), {
            cache: "no-store",
            headers: authHeaders()
          });
          if (dashRes.ok) {
            const dash = (await dashRes.json()) as { id?: string };
            if (dash.id) setMyTeamId(dash.id);
          }
        }
      } catch {
        /* optional */
      }
    }
    void loadSession();
  }, []);

  async function saveBoat() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || !profile) return;
    const name = editBoatName.trim();
    if (name.length < 2) {
      setBoatEditError("Boat name must be at least 2 characters.");
      return;
    }
    setBoatEditPending(true);
    setBoatEditError(null);
    try {
      const body: { teamId: string; name: string; registry?: string } = { teamId: profile.id, name };
      const reg = editBoatRegistry.trim();
      if (reg) body.registry = reg;
      const res = await fetch(API_TEAM_BOAT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        setBoatEditError(`Boat save failed (${res.status}).`);
        return;
      }
      toast.success("Vessel details saved.");
      setEditingBoat(false);
      await loadProfile();
    } catch {
      setBoatEditError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
    } finally {
      setBoatEditPending(false);
    }
  }

  const isOwnTeam = myTeamId === teamId;
  const canEditBoat = isAdmin;

  return (
    <PageMain className="max-w-4xl">
      <PageHeader
        kicker="Team profile"
        title={profile?.name ?? "Team"}
        description="Official tournament team file — scores, vessel, roster, and catch activity."
        aside={
          <Link href="/teams" className={`${btnGhostClass} text-center text-sm`}>
            ← All teams
          </Link>
        }
      />

      <div className={contentStackClass}>
        {error ? <InlineNotice variant="error">{error}</InlineNotice> : null}
        {loading ? <LoadingBlock label="Loading team profile…" /> : null}
        {!loading && profile ? (
          <TeamProfileView
            profile={profile}
            generalScore={generalScore}
            jackpotScore={jackpotScore}
            isOwnTeam={isOwnTeam}
            canEditBoat={canEditBoat}
            editingBoat={editingBoat}
            editBoatName={editBoatName}
            editBoatRegistry={editBoatRegistry}
            boatEditPending={boatEditPending}
            boatEditError={boatEditError}
            onEditBoatToggle={() => {
              setBoatEditError(null);
              if (editingBoat) setEditingBoat(false);
              else {
                setEditingBoat(true);
                setEditBoatName(profile.boat?.name ?? "");
                setEditBoatRegistry(profile.boat?.registry ?? "");
              }
            }}
            onEditBoatName={setEditBoatName}
            onEditBoatRegistry={setEditBoatRegistry}
            onSaveBoat={() => void saveBoat()}
          />
        ) : null}
        {!loading && !profile && !error ? (
          <InlineNotice variant="info">Team not found.</InlineNotice>
        ) : null}
      </div>
    </PageMain>
  );
}
