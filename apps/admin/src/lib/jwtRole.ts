import type { UserRole } from "@bluecup/types";

export function decodeAccessTokenRole(token: string): UserRole | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };
    const r = payload.role;
    if (
      r === "admin" ||
      r === "committee" ||
      r === "captain" ||
      r === "team_member" ||
      r === "public_view"
    ) {
      return r;
    }
    return null;
  } catch {
    return null;
  }
}
