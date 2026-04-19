"use client";

import { Card } from "@bluecup/ui";
import { useRouter } from "next/navigation";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  contentStackClass,
  fieldInputClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import { useToast } from "../../../components/Toast";
import { demoDashboardTournaments, isDemoMode, resetDemoData } from "@bluecup/types";
import { resultsCsvExportUrl } from "../../../lib/adminUtilities";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { normalizeRole } from "../../../lib/rbac";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");
const API_TOURNAMENTS = publicApiUrl("/tournaments");

type MeUser = {
  email: string;
  role: string;
};

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isOfficial: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}

function StatusPill({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        on
          ? "border-amber-400/35 bg-amber-400/10 text-amber-100"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {label}: {on ? "Yes" : "No"}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeUser | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportTournamentId, setExportTournamentId] = useState("");
  const [exportPending, setExportPending] = useState(false);
  const [exportBanner, setExportBanner] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      const token =
        typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
      if (!token) {
        router.replace("/login");
        return;
      }

      const authHeader = { Authorization: `Bearer ${token}` };

      try {
        const [meRes, tourRes] = await Promise.all([
          fetch(API_ME, { headers: authHeader, cache: "no-store" }),
          fetch(API_TOURNAMENTS, { headers: authHeader, cache: "no-store" })
        ]);

        if (cancelled) return;

        if (meRes.status === 401) {
          redirectToLogin();
          return;
        }

        if (!meRes.ok) {
          setLoadError(`Could not load profile (${meRes.status}).`);
          setLoading(false);
          return;
        }

        const meJson = (await meRes.json()) as { user?: MeUser };
        if (!meJson?.user?.email) {
          setLoadError("Invalid profile response from API.");
          setLoading(false);
          return;
        }

        setUser({ email: meJson.user.email, role: String(meJson.user.role) });

        const demo = isDemoMode();
        if (tourRes.ok) {
          const data = (await tourRes.json()) as unknown;
          let list = Array.isArray(data) ? (data as Tournament[]) : [];
          if (list.length === 0 && demo) {
            list = demoDashboardTournaments();
          }
          setTournaments(list);
        } else {
          setTournaments(demo ? demoDashboardTournaments() : []);
        }
      } catch {
        if (!cancelled) {
          setLoadError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, redirectToLogin]);

  useEffect(() => {
    setExportBanner(null);
    setExportError(null);
    setExportTournamentId((prev) => {
      if (tournaments.length === 0) return "";
      if (prev && tournaments.some((t) => t.id === prev)) return prev;
      return tournaments[0].id;
    });
  }, [tournaments]);

  async function downloadResultsCsv() {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      redirectToLogin();
      return;
    }
    if (!exportTournamentId) {
      const msg = "Select a tournament to export.";
      setExportError(msg);
      toast.error(msg);
      return;
    }
    setExportPending(true);
    setExportError(null);
    setExportBanner(null);
    try {
      const url = resultsCsvExportUrl(exportTournamentId);
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        const hint = await res.text().catch(() => "");
        const trimmed = hint.trim().slice(0, 200);
        const errMsg = trimmed || `Export failed (${res.status}).`;
        setExportError(errMsg);
        toast.error(errMsg);
        return;
      }
      const blob = await res.blob();
      const name =
        tournaments.find((t) => t.id === exportTournamentId)?.name?.replace(/[^\w\s-]/g, "")?.trim().slice(0, 60) ||
        "results";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name.replace(/\s+/g, "-").toLowerCase() || "results"}-${exportTournamentId.slice(0, 8)}.csv`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setExportError(null);
      setExportBanner("CSV saved to your downloads folder.");
      toast.success("Results CSV downloaded.");
    } catch {
      const errMsg = "Could not download export — check your connection.";
      setExportError(errMsg);
      toast.error(errMsg);
    } finally {
      setExportPending(false);
    }
  }

  if (loading) {
    return (
      <PageMain className="max-w-3xl">
        <LoadingBlock label="Loading your command center…" />
      </PageMain>
    );
  }

  if (loadError || !user) {
    return (
      <PageMain className="max-w-3xl">
        <PageHeader
          kicker="Blue Cup"
          title="Dashboard"
          description="Your session could not be restored from the API."
        />
        <div className={`${contentStackClass} max-w-lg`}>
          <InlineNotice variant="error">{loadError ?? "Something went wrong."}</InlineNotice>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className={btnGhostClass}
          >
            Back to sign in
          </button>
        </div>
      </PageMain>
    );
  }

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Command center"
        title="Dashboard"
        description="Account overview, tournament roster context, and admin export tools when you have access."
      />

      <div className={contentStackClass}>
        <div>
          <SectionLabel className="mb-3 text-slate-500">Overview</SectionLabel>
          <Card title="Your account">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="text-[15px] font-medium text-slate-100">{user.email}</dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</dt>
                <dd className="text-[15px] font-medium capitalize text-slate-100">{user.role}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {user && normalizeRole(user.role) === "admin" ? (
          <div className="rounded-2xl border border-white/[0.08] bg-slate-950/55 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-white/5 sm:p-5">
            <SectionLabel className="mb-1 text-slate-500">Admin utilities</SectionLabel>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              Exports and shortcuts for tournament control. Results use the authenticated CSV endpoint below.
            </p>
            <Card
              title="Results export"
              right={
                <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                  Admin
                </span>
              }
            >
              <p className="text-sm leading-relaxed text-slate-400">
                Download tournament results as CSV via{" "}
                <span className="font-mono text-[11px] text-slate-300">GET /exports/:tournamentId/results.csv</span>{" "}
                (authenticated).
              </p>
              <div className="mt-5 grid gap-4 sm:flex sm:flex-wrap sm:items-end">
                <label className="grid min-w-[220px] flex-1 gap-2 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tournament for export
                  </span>
                  <select
                    value={exportTournamentId}
                    onChange={(e) => {
                      setExportBanner(null);
                      setExportError(null);
                      setExportTournamentId(e.target.value);
                    }}
                    disabled={tournaments.length === 0 || exportPending}
                    className={fieldInputClass}
                  >
                    {tournaments.length === 0 ? (
                      <option value="">No tournaments</option>
                    ) : (
                      tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={exportPending || tournaments.length === 0 || !exportTournamentId}
                  onClick={() => void downloadResultsCsv()}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportPending ? "Preparing file…" : "Download results CSV"}
                </button>
              </div>
              {exportError ? (
                <div className="mt-4">
                  <InlineNotice variant="error">{exportError}</InlineNotice>
                </div>
              ) : null}
              {exportBanner ? (
                <div className="mt-4">
                  <InlineNotice variant="success">{exportBanner}</InlineNotice>
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}

        {isDemoMode() && normalizeRole(user.role) === "admin" ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Demo session</SectionLabel>
            <Card
            title="Demo mode"
            right={
              <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                Admin
              </span>
            }
            >
              <p className="text-sm leading-relaxed text-slate-400">
                Reset clears browser keys prefixed with{" "}
                <span className="font-mono text-slate-300">bluecup_demo_</span> and reloads the app so the UI returns to
                a clean demo baseline.
              </p>
              <button
                type="button"
                onClick={() => {
                  toast.success("Demo data reset — reloading.");
                  window.setTimeout(() => resetDemoData(), 450);
                }}
                className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-md shadow-amber-950/30 transition hover:bg-amber-500/25"
              >
                Reset demo data
              </button>
            </Card>
          </div>
        ) : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">Tournament roster</SectionLabel>
          {tournaments.length === 0 ? (
            <EmptyState
              title="No tournaments yet"
              description="Create or seed tournaments in the API, then refresh this page."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {tournaments.map((t) => (
                <Card
                  key={t.id}
                  title={t.name}
                  right={
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusPill label="Active" on={t.isActive} />
                      <StatusPill label="Official" on={t.isOfficial} />
                    </div>
                  }
                >
                  <dl className="grid gap-4 text-sm">
                    <div className="flex flex-col gap-1.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Location</dt>
                      <dd className="text-[15px] leading-snug text-slate-100">{t.location?.trim() ? t.location : "—"}</dd>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Starts</dt>
                        <dd className="text-[15px] leading-snug text-slate-100">{formatDate(t.startsAt)}</dd>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ends</dt>
                        <dd className="text-[15px] leading-snug text-slate-100">{formatDate(t.endsAt)}</dd>
                      </div>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageMain>
  );
}
