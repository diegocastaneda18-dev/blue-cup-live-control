"use client";

import { Card } from "@bluecup/ui";
import { useToast } from "../../../../components/Toast";
import {
  DEMO_TOURNAMENT_ID,
  demoTeamsSimpleForNewCatch,
  demoTournamentDetail,
  demoTournamentsList,
  isDemoMode
} from "@bluecup/types";
import { publicApiUrl } from "../../../../lib/env";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAMS = publicApiUrl("/teams");
const API_CATCHES = publicApiUrl("/catches");
const API_CATCH_MEDIA = publicApiUrl("/catches/media");

type TournamentOption = { id: string; name: string };

type RefRow = { id: string; name: string; code: string };

type TournamentDetail = TournamentOption & {
  categories?: RefRow[];
  species?: RefRow[];
};

type TeamRow = { id: string; name: string; captainUserId: string | null };

function authHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function uploadCatchEvidence(
  token: string,
  kind: "photo" | "video",
  file: File
): Promise<{ objectKey: string; url: string } | "too_large" | null> {
  const form = new FormData();
  form.append("file", file);
  const url = `${publicApiUrl("/catches/media/upload")}?kind=${encodeURIComponent(kind)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (res.status === 413) return "too_large";
    if (!res.ok) return null;
    const j = (await res.json()) as { objectKey?: string; url?: string };
    const objectKey = j.objectKey?.trim();
    const evidenceUrl = j.url?.trim();
    if (!objectKey || !evidenceUrl) return null;
    return { objectKey, url: evidenceUrl };
  } catch {
    return null;
  }
}

export default function NewCatchPage() {
  const router = useRouter();
  const toast = useToast();
  const [authReady, setAuthReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState("");

  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [type, setType] = useState<"release" | "weigh_in">("release");
  const [occurredAtClient, setOccurredAtClient] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [notes, setNotes] = useState("");

  const [photoObjectKey, setPhotoObjectKey] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoObjectKey, setVideoObjectKey] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoEvidenceInputKey, setPhotoEvidenceInputKey] = useState(0);
  const [videoEvidenceInputKey, setVideoEvidenceInputKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    setToken(t);
    setAuthReady(true);
    if (!t) router.replace("/login");
  }, [router]);

  const loadTournaments = useCallback(async () => {
    if (!token) return;
    setTournamentsError(null);
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
        setTournamentsError("Could not reach the API.");
      }
    }
  }, [token, router]);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (!token || !tournamentId) {
      setDetail(null);
      setCategoryId("");
      setSpeciesId("");
      return;
    }

    let cancelled = false;
    async function loadDetail() {
      setDetailError(null);
      const demo = isDemoMode();
      const applyDemoDetail = () => {
        const d = demoTournamentDetail(tournamentId);
        if (!d) return;
        setDetailError(null);
        setDetail(d as TournamentDetail);
        const cats = d.categories ?? [];
        const firstCat = cats[0]?.id ?? "";
        setCategoryId((prev) => (prev && cats.some((c) => c.id === prev) ? prev : firstCat));
        setSpeciesId("");
      };
      try {
        const res = await fetch(`${API_TOURNAMENTS}/${encodeURIComponent(tournamentId)}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          if (demo && tournamentId === DEMO_TOURNAMENT_ID) {
            applyDemoDetail();
          } else {
            setDetailError(`Could not load tournament (${res.status}).`);
            setDetail(null);
          }
          return;
        }
        const json = (await res.json()) as TournamentDetail;
        if (demo && tournamentId === DEMO_TOURNAMENT_ID && !(json.categories?.length ?? 0)) {
          applyDemoDetail();
          return;
        }
        setDetail(json);
        const cats = json.categories ?? [];
        const firstCat = cats[0]?.id ?? "";
        setCategoryId((prev) => (prev && cats.some((c) => c.id === prev) ? prev : firstCat));
        setSpeciesId("");
      } catch {
        if (!cancelled) {
          if (demo && tournamentId === DEMO_TOURNAMENT_ID) {
            applyDemoDetail();
          } else {
            setDetailError("Could not reach the API.");
          }
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [token, tournamentId, router]);

  useEffect(() => {
    if (!token || !tournamentId) {
      setTeams([]);
      return;
    }

    let cancelled = false;
    async function loadTeams() {
      setTeamsError(null);
      const demo = isDemoMode();
      const useDemoTeams = demo && tournamentId === DEMO_TOURNAMENT_ID;
      try {
        const url = `${API_TEAMS}/tournament/${encodeURIComponent(tournamentId)}`;
        const res = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          if (useDemoTeams) {
            setTeamsError(null);
            setTeams(demoTeamsSimpleForNewCatch(tournamentId));
          } else {
            setTeamsError(`Could not load teams (${res.status}).`);
            setTeams([]);
          }
          return;
        }
        const data = (await res.json()) as unknown;
        let list = Array.isArray(data) ? (data as TeamRow[]) : [];
        if (list.length === 0 && useDemoTeams) {
          list = demoTeamsSimpleForNewCatch(tournamentId);
          setTeamsError(null);
        }
        setTeams(list);
      } catch {
        if (!cancelled) {
          if (useDemoTeams) {
            setTeamsError(null);
            setTeams(demoTeamsSimpleForNewCatch(tournamentId));
          } else {
            setTeamsError("Could not reach the API.");
          }
        }
      }
    }

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [token, tournamentId, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMediaError(null);
    setCreatedId(null);
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!tournamentId || !categoryId) {
      toast.error("Select a tournament and category.");
      return;
    }

    const body: Record<string, unknown> = {
      tournamentId,
      categoryId,
      type
    };
    const sp = speciesId.trim();
    if (sp) body.speciesId = sp;
    if (occurredAtClient.trim()) {
      const d = new Date(occurredAtClient);
      if (!Number.isNaN(d.getTime())) body.occurredAtClient = d.toISOString();
    }
    const w = parseFloat(weightKg);
    if (weightKg.trim() !== "" && !Number.isNaN(w)) body.weightKg = w;
    const l = parseFloat(lengthCm);
    if (lengthCm.trim() !== "" && !Number.isNaN(l)) body.lengthCm = l;
    const n = notes.trim();
    if (n) body.notes = n;

    let effectivePhotoKey = photoObjectKey.trim();
    let effectivePhotoUrl = photoUrl.trim();
    let effectiveVideoKey = videoObjectKey.trim();
    let effectiveVideoUrl = videoUrl.trim();
    if ((effectivePhotoKey && !effectivePhotoUrl) || (!effectivePhotoKey && effectivePhotoUrl)) {
      effectivePhotoKey = "";
      effectivePhotoUrl = "";
    }
    if ((effectiveVideoKey && !effectiveVideoUrl) || (!effectiveVideoKey && effectiveVideoUrl)) {
      effectiveVideoKey = "";
      effectiveVideoUrl = "";
    }

    setSubmitting(true);
    setMediaError(null);
    try {
      const res = await fetch(API_CATCHES, {
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
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const msg = raw?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        toast.error(text || `Submit failed (${res.status}).`);
        return;
      }
      const catchId = raw?.id;
      if (!catchId) {
        toast.error("Catch created but response had no id.");
        return;
      }

      const mediaParts: { type: "photo" | "video"; objectKey: string; url: string }[] = [];
      let photoUploadFailed = false;
      let videoUploadFailed = false;
      let videoTooLarge = false;

      if (photoFile) {
        const up = await uploadCatchEvidence(token, "photo", photoFile);
        if (up && up !== "too_large") mediaParts.push({ type: "photo", objectKey: up.objectKey, url: up.url });
        else photoUploadFailed = true;
      } else if (effectivePhotoKey && effectivePhotoUrl) {
        mediaParts.push({ type: "photo", objectKey: effectivePhotoKey, url: effectivePhotoUrl });
      }

      if (videoFile) {
        const up = await uploadCatchEvidence(token, "video", videoFile);
        if (up === "too_large") {
          videoTooLarge = true;
        } else if (up) {
          mediaParts.push({ type: "video", objectKey: up.objectKey, url: up.url });
        } else {
          videoUploadFailed = true;
        }
      } else if (effectiveVideoKey && effectiveVideoUrl) {
        mediaParts.push({ type: "video", objectKey: effectiveVideoKey, url: effectiveVideoUrl });
      }

      const mediaFailures: string[] = [];
      for (const m of mediaParts) {
        const mRes = await fetch(API_CATCH_MEDIA, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            catchId,
            type: m.type,
            objectKey: m.objectKey,
            url: m.url
          })
        });
        const mRaw = (await mRes.json().catch(() => null)) as { message?: string | string[] } | null;
        if (mRes.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          router.replace("/login");
          return;
        }
        if (!mRes.ok) {
          const msg = mRaw?.message;
          const text = Array.isArray(msg) ? msg.join(" ") : msg;
          mediaFailures.push(`${m.type}: ${text || mRes.status}`);
        }
      }

      const userLines: string[] = [];
      if (photoUploadFailed) {
        userLines.push("Catch saved, but photo upload failed. You can retry later.");
      }
      if (videoTooLarge) {
        userLines.push("Catch saved, but video is too large. Please send it externally to the committee.");
      }
      if (videoUploadFailed) {
        userLines.push("Catch saved, but video upload failed. You can retry later.");
      }

      if (userLines.length > 0 || mediaFailures.length > 0) {
        const combined = [...userLines, ...mediaFailures].join(" · ");
        setMediaError(combined);
        toast.error(userLines[0] ?? `Catch saved, but media upload failed: ${mediaFailures.join(" · ")}`);
      } else {
        toast.success("Catch submitted — pending committee review.");
      }

      setCreatedId(catchId);
      setNotes("");
      setWeightKg("");
      setLengthCm("");
      setOccurredAtClient("");
      setPhotoObjectKey("");
      setPhotoUrl("");
      setVideoObjectKey("");
      setVideoUrl("");
      setPhotoFile(null);
      setVideoFile(null);
      setPhotoEvidenceInputKey((k) => k + 1);
      setVideoEvidenceInputKey((k) => k + 1);
    } catch {
      toast.error("Could not reach the API.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authReady) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="flex flex-col items-center gap-3 py-16">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400"
            aria-hidden
          />
          <p className="text-sm text-slate-400">Preparing form…</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="flex flex-col items-center gap-3 py-16">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400"
            aria-hidden
          />
          <p className="text-sm text-slate-400">Redirecting to sign in…</p>
        </div>
      </main>
    );
  }

  const categories = detail?.categories ?? [];
  const speciesList = detail?.species ?? [];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Submit a catch</h1>
          <p className="mt-2 text-slate-300">Log a catch for your team in the selected tournament.</p>
        </div>
        <Link
          href="/catches"
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
        >
          Catch history
        </Link>
      </div>

      <div className="mt-8 grid gap-6">
        {tournamentsError ? (
          <Card title="Tournaments">
            <p className="text-sm text-red-100">{tournamentsError}</p>
          </Card>
        ) : null}

        {createdId ? (
          <Card title="Submitted">
            <p className="text-sm text-emerald-100">Your catch was recorded successfully.</p>
            {mediaError ? (
              <p className="mt-2 text-sm text-amber-100">{mediaError}</p>
            ) : null}
            <Link
              href="/catches"
              className="mt-3 inline-flex rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              View catch history
            </Link>
          </Card>
        ) : null}

        <Card title="Catch details">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Tournament</span>
              <select
                required
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
              >
                <option value="" disabled>
                  Select tournament
                </option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            {detailError ? <p className="text-sm text-red-100">{detailError}</p> : null}

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Category</span>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!tournamentId || categories.length === 0}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2 disabled:opacity-50"
              >
                {categories.length === 0 ? (
                  <option value="">No categories (check tournament)</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Species (optional)</span>
              <select
                value={speciesId}
                onChange={(e) => setSpeciesId(e.target.value)}
                disabled={!tournamentId || speciesList.length === 0}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2 disabled:opacity-50"
              >
                <option value="">None</option>
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Catch type</span>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value as "release" | "weigh_in")}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
              >
                <option value="release">Release</option>
                <option value="weigh_in">Weigh-in</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Occurred at (optional, local)</span>
              <input
                type="datetime-local"
                value={occurredAtClient}
                onChange={(e) => setOccurredAtClient(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-300">Weight (kg, optional)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-300">Length (cm, optional)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Notes (optional)</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                placeholder="Optional details for the committee…"
              />
            </label>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Media evidence (optional)</p>
              <p className="mt-1 text-xs text-slate-500">
                Optional: choose a photo or video file (uploaded when you submit), or paste both a public HTTPS URL and
                storage object key. Incomplete pairs are ignored so your catch can still be saved.
              </p>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-slate-300">Photo</span>
                  <input
                    key={photoEvidenceInputKey}
                    type="file"
                    accept="image/*"
                    className="text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-slate-200"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setPhotoFile(f);
                      setPhotoObjectKey("");
                      setPhotoUrl("");
                    }}
                  />
                  <input
                    type="text"
                    value={photoObjectKey}
                    onChange={(e) => setPhotoObjectKey(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                    placeholder="Object key (e.g. mock/photo.jpg)"
                  />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                    placeholder="https://… (public image URL)"
                  />
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-slate-300">Video</span>
                  <input
                    key={videoEvidenceInputKey}
                    type="file"
                    accept="video/*"
                    className="text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-slate-200"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setVideoFile(f);
                      setVideoObjectKey("");
                      setVideoUrl("");
                    }}
                  />
                  <input
                    type="text"
                    value={videoObjectKey}
                    onChange={(e) => setVideoObjectKey(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                    placeholder="Object key (e.g. mock/clip.mp4)"
                  />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 focus:ring-2"
                    placeholder="https://… (public video URL)"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !tournamentId || !categoryId}
              className="rounded-lg bg-amber-500/90 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit catch"}
            </button>
          </form>
        </Card>

        <Card title="Teams in this tournament">
          {teamsError ? (
            <p className="text-sm text-red-100">{teamsError}</p>
          ) : !tournamentId ? (
            <p className="text-sm text-slate-200">Select a tournament to load teams.</p>
          ) : teams.length === 0 ? (
            <p className="text-sm text-slate-200">No teams listed for this tournament.</p>
          ) : (
            <ul className="divide-y divide-white/10 text-sm text-slate-200">
              {teams.map((t) => (
                <li key={t.id} className="py-2">
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
