"use client";

import { Card } from "@bluecup/ui";
import { CatchStatusBadge } from "../../../../components/CatchStatusBadge";
import { MobileScoreHero } from "../../../../components/MobileAppUi";
import { MediaUploadStatusBadge, UploadProgressBar } from "../../../../components/MediaUploadStatus";
import { retryMediaFile, userFacingUploadMessage, type MediaUploadStatus, type UploadProgress } from "../../../../lib/mediaUpload";
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
} from "../../../../components/PageChrome";
import { demoCatchDetailById, isDemoMode } from "@bluecup/types";
import { publicApiUrl } from "../../../../lib/env";
import { normalizeRole } from "../../../../lib/rbac";
import { useToast } from "../../../../components/Toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");

function teamCatchDetailUrl(catchId: string): string {
  return publicApiUrl(`/catches/${encodeURIComponent(catchId)}`);
}

function committeeCatchDetailUrl(catchId: string): string {
  return publicApiUrl(`/committee/catches/${encodeURIComponent(catchId)}`);
}

async function resolveCatchDetailUrl(token: string, catchId: string): Promise<string> {
  const meRes = await fetch(API_ME, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!meRes.ok) return teamCatchDetailUrl(catchId);

  const meJson = (await meRes.json()) as { user?: { role?: string } };
  const role = normalizeRole(meJson.user?.role ?? "");
  if (role === "admin" || role === "committee") {
    return committeeCatchDetailUrl(catchId);
  }
  return teamCatchDetailUrl(catchId);
}

type ReviewRow = {
  id: string;
  action: string;
  notes: string | null;
  penaltyPoints: number | null;
  createdAt: string;
  reviewer?: { displayName: string; email: string };
};

type CatchDetail = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  scorePreliminary: number | null;
  scoreOfficial: number | null;
  category?: { name: string; code: string } | null;
  species?: { name: string; code: string } | null;
  media?: {
    id: string;
    type: string;
    url: string;
    objectKey: string;
    uploadStatus?: MediaUploadStatus;
    errorMessage?: string | null;
  }[];
  reviews?: ReviewRow[];
};

function scoreLabel(c: CatchDetail) {
  const p = c.scorePreliminary ?? 0;
  const o = c.scoreOfficial ?? 0;
  if (p === 0 && o === 0) return null;
  const max = Math.max(p, o);
  if (p === o) return max.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${max.toLocaleString(undefined, { maximumFractionDigits: 2 })} (prelim ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })} / official ${o.toLocaleString(undefined, { maximumFractionDigits: 2 })})`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function speciesOrCategory(data: CatchDetail) {
  if (data.species) return `${data.species.name} (${data.species.code})`;
  if (data.category) return `${data.category.name} (${data.category.code})`;
  return null;
}

export default function CatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<CatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryProgress, setRetryProgress] = useState<UploadProgress | null>(null);
  const [retryingMediaId, setRetryingMediaId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setError("Invalid catch.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detailUrl = await resolveCatchDetailUrl(token, id);
      const res = await fetch(detailUrl, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (res.status === 404 || res.status === 403) {
        const demo = isDemoMode();
        const sample = demo ? demoCatchDetailById(id) : null;
        if (sample) {
          setError(null);
          setData(sample as CatchDetail);
        } else {
          setError("Catch not found.");
          setData(null);
        }
        return;
      }
      if (!res.ok) {
        const demo = isDemoMode();
        const sample = demo ? demoCatchDetailById(id) : null;
        if (sample) {
          setError(null);
          setData(sample as CatchDetail);
        } else {
          setError(`Could not load catch (${res.status}).`);
          setData(null);
        }
        return;
      }
      setData((await res.json()) as CatchDetail);
    } catch {
      const demo = isDemoMode();
      const sample = demo && id ? demoCatchDetailById(id) : null;
      if (sample) {
        setError(null);
        setData(sample as CatchDetail);
      } else {
        setError("Could not reach the API.");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retryMedia(mediaId: string, file: File) {
    const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setRetryingMediaId(mediaId);
    setRetryProgress({ loaded: 0, total: file.size, percent: 0, label: "Starting retry…" });
    const result = await retryMediaFile(token, mediaId, file, setRetryProgress);
    setRetryingMediaId(null);
    setRetryProgress(null);
    if (result.status === "ok") {
      void load();
      return;
    }
    toast.error(userFacingUploadMessage(result));
  }

  const score = data ? scoreLabel(data) : null;
  const reviews = data?.reviews ?? [];

  return (
    <PageMain className="max-w-3xl">
      <PageHeader
        kicker="Catch record"
        title="Catch detail"
        description="Full submission record — status, measurements, media, and committee reviews."
        aside={
          <div className="grid w-full gap-2 sm:w-auto sm:flex sm:flex-wrap">
            <Link href="/catches" className={`${btnGhostClass} ${btnResponsiveClass}`}>
              ← History
            </Link>
            <Link href="/catches/new" className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
              New catch
            </Link>
          </div>
        }
      />

      <div className={contentStackClass}>
        {loading ? (
          <LoadingBlock label="Loading catch…" />
        ) : error ? (
          <InlineNotice variant="error">{error}</InlineNotice>
        ) : !data ? null : (
          <>
            <MobileScoreHero
              status={data.status}
              score={score}
              type={data.type}
              speciesOrCategory={speciesOrCategory(data)}
            />
            <p className="font-mono text-xs text-slate-600">{data.id}</p>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Submission data</SectionLabel>
              <Card title="Summary">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:border-0 sm:bg-transparent sm:p-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                    <dd className="mt-2">
                      <CatchStatusBadge status={data.status} size="lg" />
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:border-0 sm:bg-transparent sm:p-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</dt>
                    <dd className="mt-2 text-base font-semibold capitalize text-slate-100">
                      {data.type.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                    <dd className="mt-1 text-base text-slate-300">{formatWhen(data.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
                    <dd className="mt-1 text-base text-slate-300">{formatWhen(data.updatedAt)}</dd>
                  </div>
                  {(data.weightKg != null || data.lengthCm != null) && (
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Measurements</dt>
                      <dd className="mt-1 text-base text-slate-300">
                        {data.weightKg != null ? `${data.weightKg} kg` : "—"}
                        {data.lengthCm != null ? ` · ${data.lengthCm} cm` : ""}
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Angler notes</dt>
                    <dd className="mt-1 text-base leading-relaxed text-slate-300">
                      {data.notes?.trim() ? data.notes : "—"}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Evidence</SectionLabel>
              <Card title="Media">
                {data.media && data.media.length > 0 ? (
                  <ul className="grid gap-3">
                    {data.media.map((m) => {
                      const ready = (m.uploadStatus ?? "ready") === "ready";
                      return (
                        <li key={m.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-amber-100">
                              {m.type}
                            </span>
                            <MediaUploadStatusBadge status={m.uploadStatus} />
                          </div>
                          {m.errorMessage ? (
                            <p className="mt-2 text-xs text-red-200/90">{m.errorMessage}</p>
                          ) : null}
                          {ready ? (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-sky-300"
                            >
                              <span className="truncate">{m.objectKey || "Open media"}</span>
                              <span className="text-xs text-slate-500">Open →</span>
                            </a>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">
                              {(m.uploadStatus ?? "ready") === "uploading" || m.uploadStatus === "processing"
                                ? "Evidence is still uploading or processing."
                                : "Evidence is not ready yet."}
                            </p>
                          )}
                          {m.uploadStatus === "failed" ? (
                            <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-100">
                              {retryingMediaId === m.id ? "Retrying…" : "Retry upload"}
                              <input
                                type="file"
                                accept={m.type === "photo" ? "image/*" : "video/*"}
                                className="sr-only"
                                disabled={retryingMediaId != null}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void retryMedia(m.id, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No media attached.</p>
                )}
                {retryProgress ? (
                  <div className="mt-4">
                    <UploadProgressBar percent={retryProgress.percent} label={retryProgress.label} />
                  </div>
                ) : null}
              </Card>
            </div>

            <div>
              <SectionLabel className="mb-3 text-slate-500">Committee</SectionLabel>
              <Card title="Reviews">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No committee reviews yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {reviews.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-base font-semibold capitalize text-slate-100">
                            {r.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-slate-500">{formatWhen(r.createdAt)}</span>
                        </div>
                        {r.reviewer ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {r.reviewer.displayName} · {r.reviewer.email}
                          </p>
                        ) : null}
                        {r.penaltyPoints != null ? (
                          <p className="mt-2 text-sm font-medium text-rose-200/90">
                            Penalty points: {r.penaltyPoints}
                          </p>
                        ) : null}
                        <p className="mt-2 text-base leading-relaxed text-slate-300">
                          {r.notes?.trim() ? r.notes : "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </PageMain>
  );
}
