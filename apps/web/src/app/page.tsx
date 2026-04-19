import { Card } from "@bluecup/ui";
import { demoDashboardTournaments, isDemoModeEnabled } from "../lib/demo";
import { getPublicApiBaseUrl, publicApiUrl } from "../lib/env";

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isOfficial: boolean;
};

const API_TOURNAMENTS = publicApiUrl("/tournaments");

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

export default async function HomePage() {
  let tournaments: Tournament[] = [];
  let error: string | null = null;
  let demoFallback = false;

  try {
    const res = await fetch(API_TOURNAMENTS, { cache: "no-store" });
    if (!res.ok) {
      error = `Could not load tournaments (${res.status}).`;
    } else {
      const data = (await res.json()) as unknown;
      tournaments = Array.isArray(data) ? (data as Tournament[]) : [];
    }
  } catch {
    error = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
  }

  const demo = isDemoModeEnabled();
  if (demo && (tournaments.length === 0 || error)) {
    demoFallback = true;
    tournaments = demoDashboardTournaments();
    error = null;
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blue Cup Live Control</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Tournaments from the API at <span className="text-slate-100">{API_TOURNAMENTS}</span>.
          </p>
          {demoFallback ? (
            <p className="mt-3 max-w-2xl rounded-xl border border-amber-500/30 bg-amber-950/35 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
              Demo mode: showing sample tournaments because the API returned no rows or could not be reached.
            </p>
          ) : null}
        </div>
        <div className="hidden sm:block">
          <div className="rounded-full bg-sky-500/20 px-4 py-2 text-sm text-sky-200">apps/web</div>
        </div>
      </div>

      <div className="mt-8">
        {error ? (
          <Card title="Unable to load tournaments">
            <p className="text-slate-200">{error}</p>
          </Card>
        ) : tournaments.length === 0 ? (
          <Card title="No tournaments yet">
            <p className="text-slate-200">
              There are no tournaments in the database. Seed or create one in the API, then refresh this page.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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
                <dl className="grid gap-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</dt>
                    <dd className="text-slate-100">{t.location?.trim() ? t.location : "—"}</dd>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Starts</dt>
                      <dd className="text-slate-100">{formatDate(t.startsAt)}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ends</dt>
                      <dd className="text-slate-100">{formatDate(t.endsAt)}</dd>
                    </div>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
