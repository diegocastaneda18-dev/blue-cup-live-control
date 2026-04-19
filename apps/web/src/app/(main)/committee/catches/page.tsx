"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../../components/CatchStatusBadge";
import { EmptyState } from "../../../../components/EmptyState";
import {
  btnGhostClass,
  contentStackClass,
  fieldInputClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../../components/PageChrome";
import { useToast } from "../../../../components/Toast";
import {
  DEMO_TOURNAMENT_ID,
  demoPendingQueue,
  demoTournamentsList,
  isDemoMode
} from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../../lib/env";
import { dispatchLeaderboardRefresh } from "../../../../lib/liveEvents";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_PENDING = publicApiUrl("/committee/catches/pending");

type TournamentOption = { id: string; name: string };

type PendingCatch = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  weightKg?: number | null;
  lengthCm?: number | null;
  notes?: string | null;
  team: { id: string; name: string };
  category: { name: string; code: string };
  species?: { name: string; code: string } | null;
  media: { id: string }[];
};

type ReviewAction = "approve" | "reject" | "request_more_evidence" | "penalize";

export default function CommitteeCatchesPage() {
  const router = useRouter();
  const toast = useToast();
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState("");

  const [pending, setPending] = useState<PendingCatch[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const [notesByCatch, setNotesByCatch] = useState<Record<string, string>>({});
  const [penaltyByCatch, setPenaltyByCatch] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    setToken(t);
    setAuthReady(true);
    if (!t) router.replace("/login");
  }, [router]);

  const loadTournaments = useCallback(async () => {
    if (!token) return;
    setTournamentsError(null);
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
          setTournamentsError(null);
          setTournaments(list);
          setTournamentId((prev) => {
            if (prev && list.some((x) => x.id === prev)) return prev;
            return list[0]?.id ?? "";
          });
        } else {
          setTournamentsError(`Could not load tournaments (${res.status}).`);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as TournamentOption[]) : [];
      if (list.length === 0 && demo) {
        list = demoTournamentsList();
        setTournamentsError(null);
      }
      setTournaments(list);
      setTournamentId((prev) => {
        if (prev && list.some((x) => x.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch {
      if (demo) {
        const list = demoTournamentsList();
        setTournamentsError(null);
        setTournaments(list);
        setTournamentId((prev) => {
          if (prev && list.some((x) => x.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      } else {
        setTournamentsError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
      }
    } finally {
      setTournamentsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!authReady || !token) return;
    void loadTournaments();
  }, [authReady, token, loadTournaments]);

  useEffect(() => {
    setReviewNotice(null);
  }, [tournamentId]);

  const loadPending = useCallback(async () => {
    if (!token || !tournamentId) {
      setPending([]);
      return;
    }
    setPendingLoading(true);
    setPendingError(null);
    const demo = isDemoMode();
    const useDemoPending = demo && tournamentId === DEMO_TOURNAMENT_ID;
    try {
      const url = `${API_PENDING}?tournamentId=${encodeURIComponent(tournamentId)}`;
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
        setPendingError("Committee or admin access required.");
        setPending([]);
        return;
      }
      if (!res.ok) {
        if (useDemoPending) {
          setPendingError(null);
          setPending(demoPendingQueue());
        } else {
          setPendingError(`Could not load pending catches (${res.status}).`);
          setPending([]);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as PendingCatch[]) : [];
      if (list.length === 0 && useDemoPending) {
        list = demoPendingQueue();
        setPendingError(null);
      }
      setPending(list);
    } catch {
      if (useDemoPending) {
        setPendingError(null);
        setPending(demoPendingQueue());
      } else {
        setPendingError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setPending([]);
      }
    } finally {
      setPendingLoading(false);
    }
  }, [token, tournamentId, router]);

  useEffect(() => {
    if (!authReady || !token) return;
    void loadPending();
  }, [authReady, token, loadPending]);

  const actionLabel: Record<ReviewAction, string> = {
    approve: "Approve",
    reject: "Reject",
    request_more_evidence: "Request more evidence",
    penalize: "Penalize"
  };

  async function submitReview(catchId: string, action: ReviewAction) {
    if (!token) {
      router.replace("/login");
      return;
    }
    setReviewNotice(null);
    setActingId(catchId);

    const body: { action: ReviewAction; notes?: string; penaltyPoints?: number } = { action };
    const n = (notesByCatch[catchId] ?? "").trim();
    if (n) body.notes = n;
    if (action === "penalize") {
      const raw = (penaltyByCatch[catchId] ?? "").trim();
      const pts = parseInt(raw, 10);
      if (Number.isNaN(pts) || pts <= 0) {
        const msg = "Penalty requires a positive integer for penalty points.";
        setReviewNotice({ variant: "error", text: msg });
        toast.error(msg);
        setActingId(null);
        return;
      }
      body.penaltyPoints = pts;
    }

    try {
      const res = await fetch(publicApiUrl(`/committee/catches/${encodeURIComponent(catchId)}/review`), {
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
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const msg = raw?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        const errMsg = text || `Review failed (${res.status}).`;
        setReviewNotice({ variant: "error", text: errMsg });
        toast.error(errMsg);
        setActingId(null);
        return;
      }
      setNotesByCatch((prev) => {
        const next = { ...prev };
        delete next[catchId];
        return next;
      });
      setPenaltyByCatch((prev) => {
        const next = { ...prev };
        delete next[catchId];
        return next;
      });
      const ok = `${actionLabel[action]} recorded — queue refreshed.`;
      setReviewNotice({ variant: "success", text: ok });
      toast.success(`${actionLabel[action]} recorded.`);
      dispatchLeaderboardRefresh();
      await loadPending();
    } catch {
      const errMsg = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
      setReviewNotice({ variant: "error", text: errMsg });
      toast.error(errMsg);
    } finally {
      setActingId(null);
    }
  }

  if (!authReady) {
    return (
      <PageMain>
        <LoadingBlock label="Preparing secure session…" />
      </PageMain>
    );
  }

  if (!token) {
    return (
      <PageMain>
        <InlineNotice variant="info">Redirecting to sign in…</InlineNotice>
      </PageMain>
    );
  }

  return (
    <PageMain>
      <PageHeader
        kicker="Committee ops"
        title="Catch review"
        description="Work the pending queue for the selected tournament. Decisions propagate to the live leaderboard and the team-facing history."
        aside={
          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100">
            Committee lane
          </span>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? <InlineNotice variant="error">{tournamentsError}</InlineNotice> : null}

        {tournamentsLoading && tournaments.length === 0 && !tournamentsError ? (
          <LoadingBlock label="Loading tournaments…" />
        ) : null}

        {!tournamentsLoading && !tournamentsError && tournaments.length === 0 ? (
          <EmptyState title="No tournaments" description="Create or seed a tournament, then refresh." />
        ) : null}

        {tournaments.length > 0 ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Tournament scope</SectionLabel>
            <Card title="Select tournament">
            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Queue context
              </span>
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
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
          <SectionLabel className="mb-3 text-slate-500">Pending queue</SectionLabel>
          {reviewNotice ? (
            <div className="mb-4">
              <InlineNotice variant={reviewNotice.variant}>{reviewNotice.text}</InlineNotice>
            </div>
          ) : null}
          {pendingLoading ? (
            <LoadingBlock label="Loading committee queue…" />
          ) : pendingError ? (
            <div className="space-y-3">
              <InlineNotice variant="error">{pendingError}</InlineNotice>
              <button type="button" onClick={() => void loadPending()} className={btnGhostClass}>
                Retry queue
              </button>
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description="Nothing is pending review for this tournament right now."
            />
          ) : (
            <div className="grid gap-5 sm:gap-6">
              {pending.map((c) => (
                <Card key={c.id} title={`Catch ${c.id.slice(0, 8)}…`}>
                  <div className="grid gap-4 text-sm text-slate-200">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Team</dt>
                        <dd className="mt-1 text-base font-semibold tracking-tight text-slate-50">{c.team.name}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</dt>
                        <dd className="mt-1 capitalize text-slate-200">{c.type.replace(/_/g, " ")}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                        <dd className="mt-1 text-slate-300">{new Date(c.createdAt).toLocaleString()}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Angler notes</dt>
                        <dd className="mt-1 leading-relaxed text-slate-300">{c.notes?.trim() ? c.notes : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Current status
                        </dt>
                        <dd className="mt-1">
                          <CatchStatusBadge status={c.status} />
                        </dd>
                      </div>
                    </dl>

                    <label className="grid gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Review notes <span className="font-normal normal-case text-slate-600">(optional)</span>
                      </span>
                      <textarea
                        rows={2}
                        value={notesByCatch[c.id] ?? ""}
                        onChange={(e) =>
                          setNotesByCatch((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className={`${fieldInputClass} resize-y`}
                        placeholder="Notes for the audit trail…"
                      />
                    </label>

                    <div className="flex flex-wrap items-end gap-3">
                      <label className="grid gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Penalty points <span className="font-normal normal-case text-slate-600">(penalize)</span>
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={penaltyByCatch[c.id] ?? ""}
                          onChange={(e) =>
                            setPenaltyByCatch((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className={`${fieldInputClass} w-32 sm:w-36`}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                      {(
                        [
                          ["approve", "Approve"],
                          ["reject", "Reject"],
                          ["request_more_evidence", "More evidence"],
                          ["penalize", "Penalize"]
                        ] as const
                      ).map(([action, label]) => (
                        <button
                          key={action}
                          type="button"
                          disabled={actingId === c.id}
                          onClick={() => void submitReview(c.id, action)}
                          className={
                            action === "approve"
                              ? "rounded-xl bg-emerald-600/90 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/30 hover:bg-emerald-500 disabled:opacity-50"
                              : action === "reject"
                                ? "rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-xs font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50"
                                : "rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-100 hover:border-sky-500/25 hover:bg-sky-500/10 disabled:opacity-50"
                          }
                        >
                          {actingId === c.id ? "Working…" : label}
                        </button>
                      ))}
                    </div>

                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageMain>
  );
}
