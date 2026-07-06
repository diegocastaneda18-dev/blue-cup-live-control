"use client";

import Link from "next/link";
import { EmptyState } from "../EmptyState";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  fieldInputClass,
  InlineNotice
} from "../PageChrome";
import {
  BroadcastScore,
  MetaChip,
  PremiumPanel,
  SectionDivider,
  StatusPill
} from "../tournament/PremiumBoardUi";

export type TeamProfileMember = {
  userId: string;
  roleLabel: string;
  user: { id: string; displayName: string; email: string; role: string };
};

export type TeamProfileData = {
  id: string;
  name: string;
  captainUserId: string | null;
  usesSonar: boolean;
  tournamentId: string;
  boat: { name: string; registry: string | null } | null;
  tournament: { id: string; name: string; isActive: boolean };
  members: TeamProfileMember[];
  jackpotEligibilities: { category: string; isEligible: boolean; approvedAt: string | null }[];
  catchStats: {
    total: number;
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

type TeamProfileViewProps = {
  profile: TeamProfileData;
  generalScore: number | null;
  jackpotScore: number | null;
  isOwnTeam: boolean;
  canEditBoat: boolean;
  editingBoat: boolean;
  editBoatName: string;
  editBoatRegistry: string;
  boatEditPending: boolean;
  boatEditError: string | null;
  onEditBoatToggle: () => void;
  onEditBoatName: (v: string) => void;
  onEditBoatRegistry: (v: string) => void;
  onSaveBoat: () => void;
};

function captainMember(profile: TeamProfileData) {
  if (!profile.captainUserId) return null;
  return profile.members.find((m) => m.userId === profile.captainUserId) ?? null;
}

function teamStatus(profile: TeamProfileData) {
  if (!profile.tournament.isActive) return { label: "Tournament closed", tone: "neutral" as const };
  if (profile.catchStats.total === 0) return { label: "Registered", tone: "warning" as const };
  if (profile.catchStats.pending > 0) return { label: "Active · review pending", tone: "gold" as const };
  return { label: "Active · competing", tone: "success" as const };
}

function jackpotEligible(profile: TeamProfileData) {
  const cat = profile.usesSonar ? "sonar" : "non_sonar";
  return profile.jackpotEligibilities.some((e) => e.category === cat && e.isEligible);
}

export function TeamProfileView({
  profile,
  generalScore,
  jackpotScore,
  isOwnTeam,
  canEditBoat,
  editingBoat,
  editBoatName,
  editBoatRegistry,
  boatEditPending,
  boatEditError,
  onEditBoatToggle,
  onEditBoatName,
  onEditBoatRegistry,
  onSaveBoat
}: TeamProfileViewProps) {
  const status = teamStatus(profile);
  const captain = captainMember(profile);
  const eligible = jackpotEligible(profile);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PremiumPanel accent="gold" className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/12 via-transparent to-sky-500/5 px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200/90">
                Official team profile
              </p>
              <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                {profile.name}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{profile.tournament.name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
                <StatusPill tone="gold">{profile.usesSonar ? "Sonar" : "Non Sonar"}</StatusPill>
                <StatusPill tone={eligible ? "success" : "warning"}>
                  {eligible ? "Jackpot eligible" : "Jackpot not eligible"}
                </StatusPill>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {isOwnTeam ? (
                <Link href="/catches/new" className={`${btnPrimaryClass} ${btnResponsiveClass} text-center`}>
                  Log catch
                </Link>
              ) : null}
              {isOwnTeam ? (
                <Link href="/catches" className={`${btnGhostClass} ${btnResponsiveClass} text-center`}>
                  Catch history
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </PremiumPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumPanel className="p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">General score</p>
          {generalScore != null && generalScore > 0 ? (
            <div className="mt-2">
              <BroadcastScore score={generalScore} size="lg" />
            </div>
          ) : (
            <p className="mt-2 text-lg font-semibold text-slate-500">—</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Tournament leaderboard line</p>
        </PremiumPanel>
        <PremiumPanel className="p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Jackpot day score</p>
          {jackpotScore != null && jackpotScore > 0 ? (
            <div className="mt-2">
              <BroadcastScore score={jackpotScore} size="lg" />
            </div>
          ) : (
            <p className="mt-2 text-lg font-semibold text-slate-500">—</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Best approved release total (latest day)</p>
        </PremiumPanel>
        <PremiumPanel className="p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Approved catches</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-200">{profile.catchStats.approved}</p>
        </PremiumPanel>
        <PremiumPanel className="p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pending review</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-100">{profile.catchStats.pending}</p>
        </PremiumPanel>
      </div>

      <SectionDivider label="Catch activity" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {(
          [
            ["Submitted", profile.catchStats.submitted],
            ["Approved", profile.catchStats.approved],
            ["Pending", profile.catchStats.pending],
            ["Rejected", profile.catchStats.rejected],
            ["Total", profile.catchStats.total]
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-4 text-center sm:px-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100 sm:text-xl">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
        <PremiumPanel accent="sky" className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Vessel</h3>
          {profile.boat ? (
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Boat name</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-50">{profile.boat.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Registry / hull ID</dt>
                <dd className="mt-1 text-slate-200">{profile.boat.registry?.trim() || "—"}</dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              title="No vessel on file"
              description="Boat name and registry have not been registered for this team yet."
            />
          )}
          {canEditBoat ? (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <button type="button" className={`${btnGhostClass} text-xs`} onClick={onEditBoatToggle}>
                {editingBoat ? "Close" : profile.boat ? "Edit vessel" : "Add vessel"}
              </button>
              {editingBoat ? (
                <form
                  className="mt-3 grid gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveBoat();
                  }}
                >
                  {boatEditError ? <InlineNotice variant="error">{boatEditError}</InlineNotice> : null}
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Boat name</span>
                    <input
                      required
                      minLength={2}
                      value={editBoatName}
                      onChange={(e) => onEditBoatName(e.target.value)}
                      className={fieldInputClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Registry</span>
                    <input
                      value={editBoatRegistry}
                      onChange={(e) => onEditBoatRegistry(e.target.value)}
                      className={fieldInputClass}
                    />
                  </label>
                  <button type="submit" disabled={boatEditPending} className={`${btnPrimaryClass} text-xs`}>
                    {boatEditPending ? "Saving…" : "Save vessel"}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </PremiumPanel>

        <PremiumPanel className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Vessel documents</h3>
          {profile.boat?.registry?.trim() ? (
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-100">Hull registration</p>
                  <p className="text-xs text-slate-500">{profile.boat.registry}</p>
                </div>
                <MetaChip>On file</MetaChip>
              </li>
            </ul>
          ) : (
            <EmptyState
              title="No documents on file"
              description="Hull registration and supporting vessel documents will appear here once provided."
            />
          )}
        </PremiumPanel>
      </div>

      <PremiumPanel className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Crew roster</h3>
        {captain ? (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">Captain</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">{captain.user.displayName}</p>
            <p className="text-sm text-slate-400">{captain.user.email}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No captain assigned.</p>
        )}

        {profile.members.length === 0 ? (
          <EmptyState title="Incomplete roster" description="No anglers are registered on this team yet." />
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {profile.members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{m.user.displayName}</p>
                  <p className="truncate text-xs text-slate-500">{m.user.email}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <MetaChip>{m.roleLabel || "Angler"}</MetaChip>
                  {m.userId === profile.captainUserId ? (
                    <span className="text-[10px] font-semibold uppercase text-amber-200/80">Captain</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PremiumPanel>

      {isOwnTeam ? (
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href="/catches" className={`${btnPrimaryClass} ${btnResponsiveClass} text-center`}>
            Open full catch history
          </Link>
          <Link href="/jackpots" className={`${btnGhostClass} ${btnResponsiveClass} text-center`}>
            View jackpot board
          </Link>
          <Link href="/leaderboard" className={`${btnGhostClass} ${btnResponsiveClass} text-center`}>
            Tournament leaderboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function TeamListCard({
  team,
  tournamentId,
  generalScore
}: {
  team: {
    id: string;
    name: string;
    usesSonar?: boolean;
    boat: { name: string; registry: string | null } | null;
    members: { userId: string; user: { displayName: string } }[];
    captainUserId: string | null;
  };
  tournamentId: string;
  generalScore: number | null;
}) {
  const captain = team.captainUserId
    ? team.members.find((m) => m.userId === team.captainUserId)?.user.displayName
    : null;

  return (
    <Link
      href={`/teams/${encodeURIComponent(team.id)}?tournamentId=${encodeURIComponent(tournamentId)}`}
      className="group block"
    >
      <PremiumPanel className="h-full p-5 transition active:scale-[0.99] group-hover:ring-1 group-hover:ring-amber-400/25 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-bold text-slate-50 group-hover:text-amber-50">{team.name}</h3>
          <StatusPill tone="gold">{team.usesSonar ? "Sonar" : "Non Sonar"}</StatusPill>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          {team.boat?.name ?? "No vessel"} · {captain ?? "No captain"}
        </p>
        {generalScore != null && generalScore > 0 ? (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <BroadcastScore score={generalScore} size="md" />
          </div>
        ) : null}
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-200/70">View profile →</p>
      </PremiumPanel>
    </Link>
  );
}
