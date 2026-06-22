/** Server-side Nest API base URL for Next.js route proxies. */
export function getNestApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim() ||
    "http://localhost:4000";
  return raw.replace(/\/+$/, "");
}
