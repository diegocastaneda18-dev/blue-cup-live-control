"use client";

import { Card } from "@bluecup/ui";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  contentStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import { CatchHistoryCard } from "../../../components/MobileAppUi";
import { summarizeMediaAvailability, type CatchMediaViewFields } from "../../../lib/catchMediaUrl";
import Link from "next/link";
import { demoCatchHistoryRows, demoTournamentsList, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { normalizeRole } from "../../../lib/rbac";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAM_HISTORY = publicApiUrl("/catches/me");
const API_TOURNAMENT_HISTORY = publicApiUrl("/committee/catches/history");

type ReviewRow = {
  id: string;
  action: string;
  notes: string | null;
  penaltyPoints: number | null;
  createdAt: string;
  reviewer?: { displayName: string; email: string };
};

type CatchRow = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  scorePreliminary?: number | null;
  scoreOfficial?: number | null;
  category?: { name: string; code: string } | null;
  species?: { name: string; code: string } | null;
  media?: CatchMediaViewFields & {
    id: string;
    type: string;
    url: string;
    objectKey: string;
    uploadStatus?: "uploading" | "processing" | "ready" | "failed";
  }[];
  reviews?: ReviewRow[];
};

function scoreParts(c: CatchRow) {
  const p = c.scorePreliminary ?? 0;
  const o = c.scoreOfficial ?? 0;
  if (p === 0 && o === 0) return { value: null as number | null, label: null as string | null };
  const max = Math.max(p, o);
  if (p === o) return { value: max, label: null };
  return {
    value: max,
    label: `${max.toLocaleString(undefined, { maximumFractionDigits: 2 })} (prelim ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })} / official ${o.toLocaleString(undefined, { maximumFractionDigits: 2 })})`
  };
}

type TournamentOption = { id: string; name: string; isActive?: boolean };

function pickTournamentId(list: TournamentOption[]): string {
  const active = list.find((t) => t.isActive);
  return active?.id ?? list[0]?.id ?? "";
}

async function resolveHistoryUrl(token: string, demo: boolean): Promise<string | null> {
  const authHeader = { Authorization: `Bearer ${token}` };
  const meRes = await fetch(API_ME, { cache: "no-store", headers: authHeader });
  if (meRes.status === 401) return API_TEAM_HISTORY;
  if (!meRes.ok) return API_TEAM_HISTORY;

  const meJson = (await meRes.json()) as { user?: { role?: string } };
  const role = normalizeRole(meJson.user?.role ?? "");
  if (role !== "admin" && role !== "committee") {
    return API_TEAM_HISTORY;
  }

  const tourRes = await fetch(API_TOURNAMENTS, { cache: "no-store", headers: authHeader });
  if (!tourRes.ok) {
    if (demo) {
      const list = demoTournamentsList();
      const tournamentId = pickTournamentId(list);
      return tournamentId
        ? `${API_TOURNAMENT_HISTORY}?tournamentId=${encodeURIComponent(tournamentId)}`
        : null;
    }
    return null;
  }

  const data = (await tourRes.json()) as unknown;
  let list = Array.isArray(data) ? (data as TournamentOption[]) : [];
  if (list.length === 0 && demo) {
    list = demoTournamentsList();
  }
  const tournamentId = pickTournamentId(list);
  if (!tournamentId) return null;
  return `${API_TOURNAMENT_HISTORY}?tournamentId=${encodeURIComponent(tournamentId)}`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function mediaSummaryLine(c: CatchRow): string | null {
  const media = c.media ?? [];
  if (media.length === 0) return null;
  const stats = summarizeMediaAvailability(media);
  if (stats.unavailable > 0) {
    return `${stats.ready} ready · ${stats.unavailable} unavailable`;
  }
  if (stats.pending > 0) return `${stats.ready} ready · ${stats.pending} processing`;
  if (stats.failed > 0) return `${stats.ready} ready · ${stats.failed} need re-upload`;
  return `${media.length} media ready`;
}

export default function CatchesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CatchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    const demo = isDemoMode();
    try {
      const historyUrl = await resolveHistoryUrl(token, demo);
      if (!historyUrl) {
        setRows([]);
        setError(null);
        return;
      }

      const res = await fetch(historyUrl, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        setRows([]);
        setError(null);
        return;
      }
      if (!res.ok) {
        if (demo) {
          setError(null);
          setRows(demoCatchHistoryRows() as CatchRow[]);
        } else {
          setError(`Could not load history (${res.status}).`);
          setRows([]);
        }
        return;
      }
      const data = (await res.json()) as unknown;
      let list = Array.isArray(data) ? (data as CatchRow[]) : [];
      if (list.length === 0 && demo) {
        list = demoCatchHistoryRows() as CatchRow[];
        setError(null);
      }
      setRows(list);
    } catch {
      if (demo) {
        setError(null);
        setRows(demoCatchHistoryRows() as CatchRow[]);
      } else {
        setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Team logbook"
        title="Catch history"
        description="A chronological record of submissions for your crew, including status, scoring line, and committee notes when present."
        aside={
          <Link href="/catches/new" className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
            New catch
          </Link>
        }
      />

      <div className={contentStackClass}>
        <div>
          <SectionLabel className="mb-3 text-slate-500">Logbook entries</SectionLabel>
          <Card title="Your catches">
            {loading ? (
              <LoadingBlock label="Loading catch history…" />
            ) : error ? (
              <div className="space-y-4">
                <InlineNotice variant="error">{error}</InlineNotice>
                <button type="button" onClick={() => void load()} className={btnGhostClass}>
                  Try again
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  title="No catches yet"
                  description="Log your first fish from New catch. Each entry appears here with live status as the committee reviews it."
                />
                <InlineNotice variant="info">
                  Tip: attach clear photos or video so verification stays fast during the broadcast window.
                </InlineNotice>
              </div>
            ) : (
              <ul className="grid gap-3 sm:gap-4">
              {rows.map((c) => {
                const score = scoreParts(c);
                return (
                  <li key={c.id}>
                    <CatchHistoryCard
                      status={c.status}
                      type={c.type}
                      categoryName={c.category?.name}
                      categoryCode={c.category?.code}
                      speciesName={c.species?.name}
                      speciesCode={c.species?.code}
                      scoreValue={score.value}
                      scoreLabel={score.label}
                      createdAt={formatWhen(c.createdAt)}
                      mediaCount={c.media?.length ?? 0}
                      mediaLine={mediaSummaryLine(c)}
                      href={`/catches/${c.id}`}
                    />
                  </li>
                );
              })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageMain>
  );
}
