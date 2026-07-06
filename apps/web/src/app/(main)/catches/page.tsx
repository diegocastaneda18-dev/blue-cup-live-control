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
import Link from "next/link";
import { demoCatchHistoryRows, isDemoMode } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_HISTORY = publicApiUrl("/catches/me");

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
  media?: { id: string; type: string; url: string; objectKey: string }[];
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

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
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
      const res = await fetch(API_HISTORY, {
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
