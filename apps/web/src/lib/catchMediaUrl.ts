export type MediaAvailabilityStatus =
  | "ready"
  | "uploading"
  | "processing"
  | "failed"
  | "legacy_unavailable"
  | "reupload_required"
  | "unavailable";

export type CatchMediaViewFields = {
  url?: string;
  resolvedMediaUrl?: string | null;
  objectKey?: string;
  storageProvider?: string;
  uploadStatus?: string;
  mediaAvailabilityStatus?: MediaAvailabilityStatus;
  mediaAvailabilityMessage?: string | null;
  linkAvailable?: boolean;
  linkUnavailableReason?: string | null;
  errorMessage?: string | null;
};

export function isLegacyCatchMediaUrl(url: string): boolean {
  return /\/uploads\/catch-evidence\//i.test(url);
}

export function inferMediaAvailabilityStatus(media: CatchMediaViewFields): MediaAvailabilityStatus {
  if (media.mediaAvailabilityStatus) return media.mediaAvailabilityStatus;
  const upload = media.uploadStatus ?? "ready";
  if (upload === "uploading") return "uploading";
  if (upload === "processing") return "processing";
  if (upload === "failed") return "reupload_required";
  if (media.linkAvailable === false) {
    const provider = (media.storageProvider ?? "").toLowerCase();
    if (provider === "legacy" || isLegacyCatchMediaUrl(media.url ?? "")) return "legacy_unavailable";
    return "unavailable";
  }
  return "ready";
}

export function mediaAvailabilityLabel(status: MediaAvailabilityStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    case "legacy_unavailable":
      return "Legacy media unavailable";
    case "reupload_required":
      return "Re-upload required";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
}

export function mediaAvailabilityTone(
  status: MediaAvailabilityStatus
): "success" | "warning" | "neutral" | "error" {
  switch (status) {
    case "ready":
      return "success";
    case "uploading":
    case "processing":
      return "warning";
    case "failed":
    case "legacy_unavailable":
    case "reupload_required":
    case "unavailable":
      return "error";
    default:
      return "neutral";
  }
}

export function resolveCatchMediaView(media: CatchMediaViewFields): {
  href: string | null;
  status: MediaAvailabilityStatus;
  message: string | null;
  showLink: boolean;
} {
  const status = inferMediaAvailabilityStatus(media);
  const message =
    media.mediaAvailabilityMessage?.trim() ||
    media.linkUnavailableReason?.trim() ||
    media.errorMessage?.trim() ||
    null;

  if (status === "ready") {
    const href = (media.resolvedMediaUrl ?? media.url)?.trim() || null;
    if (href && !isLegacyCatchMediaUrl(href)) {
      return { href, status, message: null, showLink: true };
    }
    return {
      href: null,
      status: isLegacyCatchMediaUrl(media.url ?? "") ? "legacy_unavailable" : "unavailable",
      message: message || "Media URL is unavailable.",
      showLink: false
    };
  }

  return { href: null, status, message, showLink: false };
}

/** @deprecated use resolveCatchMediaView */
export function resolveCatchMediaLink(media: CatchMediaViewFields): {
  href: string | null;
  unavailableMessage: string | null;
} {
  const view = resolveCatchMediaView(media);
  return { href: view.href, unavailableMessage: view.message };
}

export function summarizeMediaAvailability(
  media: CatchMediaViewFields[]
): { ready: number; pending: number; failed: number; unavailable: number } {
  let ready = 0;
  let pending = 0;
  let failed = 0;
  let unavailable = 0;
  for (const item of media) {
    const status = inferMediaAvailabilityStatus(item);
    if (status === "ready") ready++;
    else if (status === "uploading" || status === "processing") pending++;
    else if (status === "failed" || status === "reupload_required") failed++;
    else unavailable++;
  }
  return { ready, pending, failed, unavailable };
}
