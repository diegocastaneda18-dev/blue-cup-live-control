import { access } from "fs/promises";
import { join } from "path";
import { ObjectStorageService } from "../../infra/storage/object-storage.service";
import { isStorageEnvConfigured, resolvePublicMediaUrl } from "../../infra/storage/storage-env";

export type MediaAvailabilityStatus =
  | "ready"
  | "uploading"
  | "processing"
  | "failed"
  | "legacy_unavailable"
  | "reupload_required"
  | "unavailable";

export type CatchMediaLike = {
  id: string;
  type: string;
  objectKey: string;
  url: string;
  storageProvider: string;
  uploadStatus: string;
  errorMessage?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

export type ResolvedCatchMedia = CatchMediaLike & {
  resolvedMediaUrl: string | null;
  mediaAvailabilityStatus: MediaAvailabilityStatus;
  mediaAvailabilityMessage: string | null;
  linkAvailable: boolean;
  linkUnavailableReason: string | null;
};

const S3_PROVIDERS = new Set(["s3", "r2", "railway"]);

export function storageEnvConfigured(): boolean {
  return isStorageEnvConfigured();
}

export function computePublicUrlFromEnv(objectKey: string): string | null {
  return resolvePublicMediaUrl(objectKey);
}

export function isLegacyCatchMedia(media: { storageProvider?: string; url?: string }): boolean {
  const provider = (media.storageProvider ?? "").trim().toLowerCase();
  if (provider === "legacy") return true;
  return /\/uploads\/catch-evidence\//i.test(media.url ?? "");
}

export function isS3CompatibleStorageProvider(provider: string): boolean {
  const normalized = (provider ?? "").trim().toLowerCase();
  if (normalized === "legacy") return false;
  if (S3_PROVIDERS.has(normalized)) return true;
  return !isLegacyCatchMedia({ storageProvider: provider, url: "" });
}

export async function legacyMediaFileExists(objectKey: string): Promise<boolean> {
  try {
    await access(join(process.cwd(), "uploads", objectKey));
    return true;
  } catch {
    return false;
  }
}

export async function resolveCatchMediaForClient(
  storage: ObjectStorageService,
  media: CatchMediaLike
): Promise<ResolvedCatchMedia> {
  const uploadStatus = media.uploadStatus ?? "ready";
  const base = { ...media };

  if (uploadStatus === "uploading") {
    return {
      ...base,
      url: media.url,
      resolvedMediaUrl: null,
      mediaAvailabilityStatus: "uploading",
      mediaAvailabilityMessage: null,
      linkAvailable: false,
      linkUnavailableReason: null
    };
  }

  if (uploadStatus === "processing") {
    return {
      ...base,
      url: media.url,
      resolvedMediaUrl: null,
      mediaAvailabilityStatus: "processing",
      mediaAvailabilityMessage: null,
      linkAvailable: false,
      linkUnavailableReason: null
    };
  }

  if (uploadStatus === "failed") {
    const message = media.errorMessage?.trim() || "Upload failed — re-upload required.";
    return {
      ...base,
      url: media.url,
      resolvedMediaUrl: null,
      mediaAvailabilityStatus: "reupload_required",
      mediaAvailabilityMessage: message,
      linkAvailable: false,
      linkUnavailableReason: message
    };
  }

  if (isLegacyCatchMedia(media)) {
    const exists = await legacyMediaFileExists(media.objectKey);
    if (exists) {
      return {
        ...base,
        url: media.url,
        resolvedMediaUrl: media.url,
        mediaAvailabilityStatus: "ready",
        mediaAvailabilityMessage: null,
        linkAvailable: true,
        linkUnavailableReason: null
      };
    }
    const message =
      media.errorMessage?.trim() || "Legacy media file is no longer available on the server.";
    return {
      ...base,
      url: media.url,
      resolvedMediaUrl: null,
      mediaAvailabilityStatus: "legacy_unavailable",
      mediaAvailabilityMessage: message,
      linkAvailable: false,
      linkUnavailableReason: message
    };
  }

  if (isS3CompatibleStorageProvider(media.storageProvider) && media.objectKey.trim()) {
    const resolved =
      storage.isConfigured() ? storage.publicUrl(media.objectKey) : computePublicUrlFromEnv(media.objectKey);
    if (resolved) {
      return {
        ...base,
        url: resolved,
        resolvedMediaUrl: resolved,
        mediaAvailabilityStatus: "ready",
        mediaAvailabilityMessage: null,
        linkAvailable: true,
        linkUnavailableReason: null
      };
    }
    const message = "Object storage URL could not be resolved — set S3_PUBLIC_BASE_URL to your R2 public domain (r2.dev or custom domain).";
    return {
      ...base,
      url: media.url,
      resolvedMediaUrl: null,
      mediaAvailabilityStatus: "unavailable",
      mediaAvailabilityMessage: message,
      linkAvailable: false,
      linkUnavailableReason: message
    };
  }

  const stored = media.url?.trim() ?? "";
  if (stored && !isLegacyCatchMedia({ url: stored, storageProvider: media.storageProvider })) {
    return {
      ...base,
      url: stored,
      resolvedMediaUrl: stored,
      mediaAvailabilityStatus: "ready",
      mediaAvailabilityMessage: null,
      linkAvailable: true,
      linkUnavailableReason: null
    };
  }

  const message = "Media URL is unavailable.";
  return {
    ...base,
    url: stored,
    resolvedMediaUrl: null,
    mediaAvailabilityStatus: "unavailable",
    mediaAvailabilityMessage: message,
    linkAvailable: false,
    linkUnavailableReason: message
  };
}

export async function resolveCatchMediaList(
  storage: ObjectStorageService,
  media: CatchMediaLike[]
): Promise<ResolvedCatchMedia[]> {
  return Promise.all(media.map((item) => resolveCatchMediaForClient(storage, item)));
}

export async function planCatchMediaNormalization(media: CatchMediaLike): Promise<{
  storageProvider?: string;
  url?: string;
  errorMessage?: string | null;
}> {
  const updates: { storageProvider?: string; url?: string; errorMessage?: string | null } = {};

  if (isLegacyCatchMedia(media)) {
    if (media.storageProvider !== "legacy") updates.storageProvider = "legacy";
    const exists = await legacyMediaFileExists(media.objectKey);
    if (!exists) {
      const message = "Legacy media file is no longer available on the server.";
      if (media.errorMessage?.trim() !== message) updates.errorMessage = message;
    }
    return updates;
  }

  if (isS3CompatibleStorageProvider(media.storageProvider) && media.objectKey.trim()) {
    const nextUrl = computePublicUrlFromEnv(media.objectKey);
    if (nextUrl && nextUrl !== media.url) updates.url = nextUrl;
  }

  return updates;
}
