import { publicApiUrl } from "./env";

export type MediaUploadStatus = "uploading" | "processing" | "ready" | "failed";

export type CatchMediaRow = {
  id: string;
  type: string;
  url: string;
  objectKey: string;
  uploadStatus?: MediaUploadStatus;
  errorMessage?: string | null;
  sizeBytes?: number | null;
};

export type InitUploadResponse = {
  mediaId: string;
  mode: "single" | "multipart";
  objectKey: string;
  url: string;
  presignedUrl: string | null;
  uploadId: string | null;
  partSize: number | null;
  totalParts: number | null;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
  label: string;
};

export type MediaUploadErrorCode =
  | "too_large"
  | "storage_unavailable"
  | "storage_not_configured"
  | "storage_auth_error"
  | "storage_bucket_error"
  | "multipart_init_failed"
  | "presign_failed"
  | "part_upload_failed"
  | "complete_failed"
  | "legacy_failed"
  | "metadata_save_failed"
  | "unknown";

export type MediaUploadFailure = {
  status: "failed";
  code: MediaUploadErrorCode;
  message: string;
  stage?: string;
  mediaId?: string;
};

export type MediaUploadSuccess =
  | { status: "ok"; mode: "direct"; mediaId: string; url: string; objectKey: string }
  | { status: "ok"; mode: "legacy"; objectKey: string; url: string };

export type UploadCatchFileResult = MediaUploadSuccess | MediaUploadFailure | { status: "too_large"; message: string };

/** Legacy API proxy upload limit — must match catch.controller.ts multer cap. */
export const LEGACY_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

const R2_CORS_HINT =
  "Check Cloudflare R2 bucket CORS allows PUT, GET, HEAD from your web origin and exposes ETag.";

const PRESIGN_BATCH = 4;

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function mapApiCode(code?: string, stage?: string): MediaUploadErrorCode {
  if (!code) {
    if (stage === "multipart_init") return "multipart_init_failed";
    if (stage === "presign_parts") return "presign_failed";
    if (stage === "multipart_complete") return "complete_failed";
    if (stage === "metadata_save") return "metadata_save_failed";
    return "unknown";
  }
  if (code === "STORAGE_NOT_CONFIGURED") return "storage_not_configured";
  if (code.startsWith("STORAGE_AUTH") || code === "STORAGE_ACCESS_DENIED") return "storage_auth_error";
  if (code.includes("BUCKET")) return "storage_bucket_error";
  if (code === "STORAGE_MULTIPART_INIT_FAILED" || stage === "multipart_init") return "multipart_init_failed";
  if (stage === "presign_parts") return "presign_failed";
  if (stage === "multipart_complete") return "complete_failed";
  if (code === "METADATA_SAVE_FAILED") return "metadata_save_failed";
  return "storage_unavailable";
}

async function parseApiError(res: Response): Promise<{ message: string; code?: string; stage?: string }> {
  const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return { message: `Request failed (${res.status})` };

  const nested =
    typeof raw.message === "object" && raw.message !== null ? (raw.message as Record<string, unknown>) : null;
  const payload = nested ?? raw;
  const msg = payload.message ?? raw.message;
  const message =
    typeof msg === "string"
      ? msg.trim()
      : Array.isArray(msg)
        ? msg.join(" ").trim()
        : `Request failed (${res.status})`;
  const code =
    typeof payload.code === "string"
      ? payload.code
      : typeof raw.code === "string"
        ? raw.code
        : undefined;
  const stage =
    typeof payload.stage === "string"
      ? payload.stage
      : typeof raw.stage === "string"
        ? raw.stage
        : undefined;
  return { message, code, stage };
}

function failureFromResponse(
  res: Response,
  parsed: { message: string; code?: string; stage?: string },
  mediaId?: string
): MediaUploadFailure {
  return {
    status: "failed",
    code: mapApiCode(parsed.code, parsed.stage),
    message: parsed.message,
    stage: parsed.stage,
    mediaId
  };
}

export async function uploadCatchMediaDirect(
  token: string,
  catchId: string,
  kind: "photo" | "video",
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<MediaUploadSuccess | MediaUploadFailure | { status: "too_large"; message: string }> {
  const initRes = await fetch(publicApiUrl("/catches/media/uploads/init"), {
    method: "POST",
    cache: "no-store",
    headers: authHeaders(token),
    body: JSON.stringify({
      catchId,
      type: kind,
      mimeType: file.type || (kind === "photo" ? "image/jpeg" : "video/mp4"),
      sizeBytes: file.size,
      fileName: file.name
    })
  });

  if (initRes.status === 413) {
    return { status: "too_large", message: "File exceeds the configured upload size limit." };
  }

  if (!initRes.ok) {
    const parsed = await parseApiError(initRes);
    return failureFromResponse(initRes, parsed);
  }

  const init = (await initRes.json()) as InitUploadResponse;

  if (init.mode === "single" && init.presignedUrl) {
    onProgress?.({ loaded: 0, total: file.size, percent: 0, label: "Uploading photo…" });
    let putRes: Response;
    try {
      putRes = await fetch(init.presignedUrl, {
        method: "PUT",
        cache: "no-store",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file
      });
    } catch {
      await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/abort`), {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(token)
      }).catch(() => undefined);
      return {
        status: "failed",
        code: "part_upload_failed",
        message: `Photo upload to storage failed (network or CORS). ${R2_CORS_HINT}`,
        stage: "part_upload",
        mediaId: init.mediaId
      };
    }
    if (!putRes.ok) {
      await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/abort`), {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(token)
      }).catch(() => undefined);
      return {
        status: "failed",
        code: "part_upload_failed",
        message: `Photo upload to storage failed (${putRes.status}). ${R2_CORS_HINT}`,
        stage: "part_upload",
        mediaId: init.mediaId
      };
    }
    onProgress?.({ loaded: file.size, total: file.size, percent: 100, label: "Finalizing…" });
    const completeRes = await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/complete`), {
      method: "POST",
      cache: "no-store",
      headers: authHeaders(token),
      body: JSON.stringify({})
    });
    if (!completeRes.ok) {
      const parsed = await parseApiError(completeRes);
      return failureFromResponse(completeRes, parsed, init.mediaId);
    }
    return { status: "ok", mode: "direct", mediaId: init.mediaId, url: init.url, objectKey: init.objectKey };
  }

  if (init.mode !== "multipart" || !init.partSize || !init.totalParts) {
    return {
      status: "failed",
      code: "multipart_init_failed",
      message: "Video multipart upload was not initialized correctly by the API.",
      stage: "multipart_init",
      mediaId: init.mediaId
    };
  }

  const partSize = init.partSize;
  const totalParts = init.totalParts;
  const completedParts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = 0;

  for (let batchStart = 1; batchStart <= totalParts; batchStart += PRESIGN_BATCH) {
    const batchNumbers = Array.from(
      { length: Math.min(PRESIGN_BATCH, totalParts - batchStart + 1) },
      (_, i) => batchStart + i
    );

    const presignRes = await fetch(
      publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/presign-parts`),
      {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(token),
        body: JSON.stringify({ partNumbers: batchNumbers })
      }
    );
    if (!presignRes.ok) {
      const parsed = await parseApiError(presignRes);
      return failureFromResponse(presignRes, { ...parsed, stage: parsed.stage ?? "presign_parts" }, init.mediaId);
    }
    const presigned = (await presignRes.json()) as { parts: { partNumber: number; url: string }[] };

    for (const part of presigned.parts) {
      const start = (part.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      let putRes: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          putRes = await fetch(part.url, {
            method: "PUT",
            cache: "no-store",
            body: chunk
          });
        } catch {
          putRes = null;
        }
        if (putRes?.ok) break;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
      if (!putRes?.ok) {
        await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/abort`), {
          method: "POST",
          cache: "no-store",
          headers: authHeaders(token)
        }).catch(() => undefined);
        return {
          status: "failed",
          code: "part_upload_failed",
          message: `Video part ${part.partNumber}/${totalParts} upload failed. ${R2_CORS_HINT}`,
          stage: "part_upload",
          mediaId: init.mediaId
        };
      }

      const etag = putRes.headers.get("ETag") ?? putRes.headers.get("etag");
      if (!etag) {
        return {
          status: "failed",
          code: "part_upload_failed",
          message: `Video part ${part.partNumber}/${totalParts} missing ETag from storage.`,
          stage: "part_upload",
          mediaId: init.mediaId
        };
      }
      completedParts.push({ partNumber: part.partNumber, etag: etag.replace(/"/g, "") });
      uploadedBytes += chunk.size;
      onProgress?.({
        loaded: uploadedBytes,
        total: file.size,
        percent: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
        label: `Uploading video… part ${part.partNumber}/${totalParts}`
      });
    }
  }

  onProgress?.({ loaded: file.size, total: file.size, percent: 100, label: "Finalizing video…" });
  const completeRes = await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(init.mediaId)}/complete`), {
    method: "POST",
    cache: "no-store",
    headers: authHeaders(token),
    body: JSON.stringify({ parts: completedParts })
  });
  if (!completeRes.ok) {
    const parsed = await parseApiError(completeRes);
    return failureFromResponse(completeRes, { ...parsed, stage: parsed.stage ?? "multipart_complete" }, init.mediaId);
  }

  return { status: "ok", mode: "direct", mediaId: init.mediaId, url: init.url, objectKey: init.objectKey };
}

/** Legacy API proxy upload — small photos only when object storage is unavailable. */
export async function uploadCatchEvidenceLegacy(
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
      cache: "no-store",
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

export async function registerLegacyCatchMedia(
  token: string,
  catchId: string,
  type: "photo" | "video",
  objectKey: string,
  url: string
): Promise<boolean> {
  const res = await fetch(publicApiUrl("/catches/media"), {
    method: "POST",
    cache: "no-store",
    headers: authHeaders(token),
    body: JSON.stringify({ catchId, type, objectKey, url })
  });
  return res.ok;
}

export function userFacingUploadMessage(failure: MediaUploadFailure): string {
  switch (failure.code) {
    case "storage_not_configured":
      return "Object storage is not configured on the API. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY (Cloudflare R2 in production).";
    case "storage_auth_error":
      return "Storage authentication failed. Verify S3_ACCESS_KEY and S3_SECRET_KEY.";
    case "storage_bucket_error":
      return "Storage bucket error. Verify S3_BUCKET exists and credentials can access it.";
    case "multipart_init_failed":
      return `Multipart upload could not start: ${failure.message}`;
    case "presign_failed":
      return `Could not prepare upload parts: ${failure.message}`;
    case "part_upload_failed":
      return failure.message;
    case "complete_failed":
      return `Upload finalization failed: ${failure.message}`;
    case "metadata_save_failed":
      return `Upload record could not be saved: ${failure.message}`;
    case "legacy_failed":
      return "Small-file API upload failed. Configure S3 for reliable media uploads.";
    default:
      return failure.message || "Media upload failed.";
  }
}

export async function uploadCatchFile(
  token: string,
  catchId: string,
  kind: "photo" | "video",
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadCatchFileResult> {
  const mustUseMultipart = kind === "video" || file.size > LEGACY_UPLOAD_MAX_BYTES;
  const direct = await uploadCatchMediaDirect(token, catchId, kind, file, onProgress);

  if (direct.status === "too_large") {
    return direct;
  }
  if (direct.status === "ok") {
    return direct;
  }

  if (mustUseMultipart) {
    return direct;
  }

  if (direct.code !== "storage_not_configured" && direct.code !== "storage_unavailable") {
    return direct;
  }

  onProgress?.({ loaded: 0, total: file.size, percent: 0, label: "Uploading via API…" });
  const legacy = await uploadCatchEvidenceLegacy(token, kind, file);
  if (legacy === "too_large") {
    return { status: "too_large", message: "File exceeds the 20 MB legacy API upload limit." };
  }
  if (!legacy) {
    return {
      status: "failed",
      code: "legacy_failed",
      message: "Legacy API upload failed. Configure S3 object storage for reliable uploads."
    };
  }
  const ok = await registerLegacyCatchMedia(token, catchId, kind, legacy.objectKey, legacy.url);
  if (!ok) {
    return {
      status: "failed",
      code: "metadata_save_failed",
      message: "File uploaded but catch media record could not be saved."
    };
  }
  onProgress?.({ loaded: file.size, total: file.size, percent: 100, label: "Upload complete" });
  return { status: "ok", mode: "legacy", objectKey: legacy.objectKey, url: legacy.url };
}

export async function retryMediaFile(
  token: string,
  mediaId: string,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<MediaUploadSuccess | MediaUploadFailure> {
  const retryRes = await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(mediaId)}/retry`), {
    method: "POST",
    cache: "no-store",
    headers: authHeaders(token)
  });
  if (!retryRes.ok) {
    const parsed = await parseApiError(retryRes);
    return failureFromResponse(retryRes, parsed, mediaId);
  }
  const retry = (await retryRes.json()) as InitUploadResponse & { media?: { id: string } };

  if (retry.mode === "single" && retry.presignedUrl) {
    onProgress?.({ loaded: 0, total: file.size, percent: 0, label: "Retrying photo upload…" });
    const putRes = await fetch(retry.presignedUrl, {
      method: "PUT",
      cache: "no-store",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file
    });
    if (!putRes.ok) {
      return {
        status: "failed",
        code: "part_upload_failed",
        message: `Photo retry upload failed (${putRes.status}).`,
        stage: "part_upload",
        mediaId
      };
    }
    const completeRes = await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(mediaId)}/complete`), {
      method: "POST",
      cache: "no-store",
      headers: authHeaders(token),
      body: JSON.stringify({})
    });
    if (!completeRes.ok) {
      const parsed = await parseApiError(completeRes);
      return failureFromResponse(completeRes, parsed, mediaId);
    }
    return { status: "ok", mode: "direct", mediaId, url: retry.url, objectKey: retry.objectKey };
  }

  if (retry.mode !== "multipart" || !retry.partSize || !retry.totalParts) {
    return {
      status: "failed",
      code: "multipart_init_failed",
      message: "Video retry did not receive multipart upload parameters.",
      stage: "multipart_init",
      mediaId
    };
  }

  const partSize = retry.partSize;
  const totalParts = retry.totalParts;
  const completedParts: { partNumber: number; etag: string }[] = [];
  let uploadedBytes = 0;

  for (let batchStart = 1; batchStart <= totalParts; batchStart += PRESIGN_BATCH) {
    const batchNumbers = Array.from(
      { length: Math.min(PRESIGN_BATCH, totalParts - batchStart + 1) },
      (_, i) => batchStart + i
    );
    const presignRes = await fetch(
      publicApiUrl(`/catches/media/uploads/${encodeURIComponent(mediaId)}/presign-parts`),
      {
        method: "POST",
        cache: "no-store",
        headers: authHeaders(token),
        body: JSON.stringify({ partNumbers: batchNumbers })
      }
    );
    if (!presignRes.ok) {
      const parsed = await parseApiError(presignRes);
      return failureFromResponse(presignRes, { ...parsed, stage: parsed.stage ?? "presign_parts" }, mediaId);
    }
    const presigned = (await presignRes.json()) as { parts: { partNumber: number; url: string }[] };

    for (const part of presigned.parts) {
      const start = (part.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);
      const putRes = await fetch(part.url, { method: "PUT", cache: "no-store", body: chunk });
      if (!putRes.ok) {
        return {
          status: "failed",
          code: "part_upload_failed",
          message: `Video retry part ${part.partNumber}/${totalParts} failed (${putRes.status}).`,
          stage: "part_upload",
          mediaId
        };
      }
      const etag = putRes.headers.get("ETag") ?? putRes.headers.get("etag");
      if (!etag) {
        return {
          status: "failed",
          code: "part_upload_failed",
          message: `Video retry part ${part.partNumber}/${totalParts} missing ETag.`,
          stage: "part_upload",
          mediaId
        };
      }
      completedParts.push({ partNumber: part.partNumber, etag: etag.replace(/"/g, "") });
      uploadedBytes += chunk.size;
      onProgress?.({
        loaded: uploadedBytes,
        total: file.size,
        percent: Math.min(99, Math.round((uploadedBytes / file.size) * 100)),
        label: `Retrying video… part ${part.partNumber}/${totalParts}`
      });
    }
  }

  const completeRes = await fetch(publicApiUrl(`/catches/media/uploads/${encodeURIComponent(mediaId)}/complete`), {
    method: "POST",
    cache: "no-store",
    headers: authHeaders(token),
    body: JSON.stringify({ parts: completedParts })
  });
  if (!completeRes.ok) {
    const parsed = await parseApiError(completeRes);
    return failureFromResponse(completeRes, { ...parsed, stage: parsed.stage ?? "multipart_complete" }, mediaId);
  }
  return { status: "ok", mode: "direct", mediaId, url: retry.url, objectKey: retry.objectKey };
}

export function mediaStatusLabel(status?: MediaUploadStatus): string {
  switch (status) {
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "Ready";
  }
}

export function mediaStatusTone(status?: MediaUploadStatus): "success" | "warning" | "neutral" | "error" {
  switch (status) {
    case "uploading":
    case "processing":
      return "warning";
    case "ready":
      return "success";
    case "failed":
      return "error";
    default:
      return "success";
  }
}

export function summarizeCatchMedia(media: CatchMediaRow[]): {
  ready: number;
  pending: number;
  failed: number;
} {
  let ready = 0;
  let pending = 0;
  let failed = 0;
  for (const m of media) {
    const s = m.uploadStatus ?? "ready";
    if (s === "ready") ready++;
    else if (s === "failed") failed++;
    else pending++;
  }
  return { ready, pending, failed };
}
