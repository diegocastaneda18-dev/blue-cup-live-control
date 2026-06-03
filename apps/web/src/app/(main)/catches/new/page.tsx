"use client";

import { Card } from "@bluecup/ui";
import { useToast } from "../../../../components/Toast";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  contentStackClass,
  FieldGroup,
  fieldInputClass,
  FormField,
  formStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel,
  StickyFormActions
} from "../../../../components/PageChrome";
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
  const [showAdvancedMedia, setShowAdvancedMedia] = useState(false);

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
      <PageMain className="max-w-2xl">
        <LoadingBlock label="Preparing form…" />
      </PageMain>
    );
  }

  if (!token) {
    return (
      <PageMain className="max-w-2xl">
        <LoadingBlock label="Redirecting to sign in…" />
      </PageMain>
    );
  }

  const categories = detail?.categories ?? [];
  const speciesList = detail?.species ?? [];

  return (
    <PageMain className="max-w-2xl">
      <PageHeader
        kicker="On the water"
        title="Submit a catch"
        description="Log a catch for your team in the selected tournament."
        aside={
          <Link href="/catches" className={`${btnGhostClass} ${btnResponsiveClass}`}>
            Catch history
          </Link>
        }
      />

      <div className={contentStackClass}>
        {tournamentsError ? <InlineNotice variant="error">{tournamentsError}</InlineNotice> : null}

        {createdId ? (
          <Card title="Submitted">
            <p className="text-sm text-emerald-100">Your catch was recorded successfully.</p>
            {mediaError ? (
              <div className="mt-3">
                <InlineNotice variant="warning">{mediaError}</InlineNotice>
              </div>
            ) : null}
            <Link href="/catches" className={`${btnPrimaryClass} ${btnResponsiveClass} mt-4`}>
              View catch history
            </Link>
          </Card>
        ) : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">Catch details</SectionLabel>
          <Card title="Submission form">
          <form className={formStackClass} onSubmit={onSubmit}>
            <FieldGroup title="Tournament" description="Pick the event and category for this catch.">
              <FormField label="Tournament">
                <select
                  required
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  className={fieldInputClass}
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
              </FormField>

              {detailError ? <InlineNotice variant="error">{detailError}</InlineNotice> : null}

              <FormField label="Category">
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!tournamentId || categories.length === 0}
                  className={fieldInputClass}
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
              </FormField>

              <FormField label="Species" optional>
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  disabled={!tournamentId || speciesList.length === 0}
                  className={fieldInputClass}
                >
                  <option value="">None</option>
                  {speciesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Catch type">
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as "release" | "weigh_in")}
                  className={fieldInputClass}
                >
                  <option value="release">Release</option>
                  <option value="weigh_in">Weigh-in</option>
                </select>
              </FormField>
            </FieldGroup>

            <FieldGroup title="Measurements" description="Add weight or length when available.">
              <FormField label="Occurred at" optional hint="Local time on the boat.">
                <input
                  type="datetime-local"
                  value={occurredAtClient}
                  onChange={(e) => setOccurredAtClient(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>

              <FormField label="Weight (kg)" optional>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>

              <FormField label="Length (cm)" optional>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>

              <FormField label="Notes" optional hint="Anything the committee should know.">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${fieldInputClass} resize-y`}
                  placeholder="Optional details for the committee…"
                />
              </FormField>
            </FieldGroup>

            <FieldGroup
              title="Photo & video"
              description="Tap to capture evidence from your phone. Upload happens when you submit."
            >
              <FormField label="Photo" optional>
                <input
                  key={photoEvidenceInputKey}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="min-h-11 w-full text-sm text-slate-400 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-slate-200"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPhotoFile(f);
                    setPhotoObjectKey("");
                    setPhotoUrl("");
                  }}
                />
              </FormField>

              <FormField label="Video" optional hint="Large clips may need to be sent to the committee separately.">
                <input
                  key={videoEvidenceInputKey}
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="min-h-11 w-full text-sm text-slate-400 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-slate-200"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setVideoFile(f);
                    setVideoObjectKey("");
                    setVideoUrl("");
                  }}
                />
              </FormField>

              <button
                type="button"
                onClick={() => setShowAdvancedMedia((v) => !v)}
                className={`${btnGhostClass} ${btnResponsiveClass} text-xs sm:hidden`}
              >
                {showAdvancedMedia ? "Hide URL fields" : "Paste URL / object key instead"}
              </button>

              <div className={`grid gap-5 ${showAdvancedMedia ? "" : "hidden sm:grid"}`}>
                <FormField label="Photo object key" optional>
                  <input
                    type="text"
                    value={photoObjectKey}
                    onChange={(e) => setPhotoObjectKey(e.target.value)}
                    className={fieldInputClass}
                    placeholder="e.g. mock/photo.jpg"
                  />
                </FormField>
                <FormField label="Photo URL" optional>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className={fieldInputClass}
                    placeholder="https://…"
                  />
                </FormField>
                <FormField label="Video object key" optional>
                  <input
                    type="text"
                    value={videoObjectKey}
                    onChange={(e) => setVideoObjectKey(e.target.value)}
                    className={fieldInputClass}
                    placeholder="e.g. mock/clip.mp4"
                  />
                </FormField>
                <FormField label="Video URL" optional>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className={fieldInputClass}
                    placeholder="https://…"
                  />
                </FormField>
              </div>
            </FieldGroup>

            <StickyFormActions>
              <button
                type="submit"
                disabled={submitting || !tournamentId || !categoryId}
                className={`${btnPrimaryClass} ${btnResponsiveClass}`}
              >
                {submitting ? "Submitting…" : "Submit catch"}
              </button>
            </StickyFormActions>
          </form>
          </Card>
        </div>

        <div>
          <SectionLabel className="mb-3 text-slate-500">Teams in tournament</SectionLabel>
          <Card title="Registered crews">
          {teamsError ? (
            <InlineNotice variant="error">{teamsError}</InlineNotice>
          ) : !tournamentId ? (
            <p className="text-sm leading-relaxed text-slate-400">Select a tournament to load teams.</p>
          ) : teams.length === 0 ? (
            <p className="text-sm leading-relaxed text-slate-400">No teams listed for this tournament.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06] text-sm text-slate-200">
              {teams.map((t) => (
                <li key={t.id} className="min-h-11 py-3">
                  {t.name}
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
