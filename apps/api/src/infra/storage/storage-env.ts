/** Shared S3-compatible storage env helpers (MinIO local, Cloudflare R2 production, etc.). */

export function storageEndpoint(): string {
  return (process.env.S3_ENDPOINT ?? "").trim();
}

export function isCloudflareR2Endpoint(endpoint = storageEndpoint()): boolean {
  return endpoint.includes("r2.cloudflarestorage.com");
}

export function isStorageEnvConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY?.trim() &&
      process.env.S3_SECRET_KEY?.trim() &&
      storageEndpoint()
  );
}

export function resolveForcePathStyle(endpoint = storageEndpoint()): boolean {
  if (isCloudflareR2Endpoint(endpoint)) return false;
  if (process.env.S3_FORCE_PATH_STYLE === "true") return true;
  return Boolean(endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1")));
}

export function encodeObjectKeyPath(objectKey: string): string {
  return objectKey
    .trim()
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

/**
 * Public URL for viewing media in the browser.
 * R2 requires S3_PUBLIC_BASE_URL (r2.dev subdomain or custom domain) — the S3 API endpoint is not public CDN.
 */
export function resolvePublicMediaUrl(objectKey: string): string | null {
  const key = objectKey.trim();
  if (!key) return null;

  const encoded = encodeObjectKeyPath(key);
  const publicBase = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  if (publicBase) return `${publicBase}/${encoded}`;

  const endpoint = storageEndpoint().replace(/\/+$/, "");
  if (isCloudflareR2Endpoint(endpoint)) return null;

  const bucket = process.env.S3_BUCKET?.trim();
  if (endpoint && bucket) return `${endpoint}/${bucket}/${encoded}`;

  return null;
}
