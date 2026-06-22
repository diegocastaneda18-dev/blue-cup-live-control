export type ExperienceStorageDriver = "file" | "supabase";
export type AdminAuthMode = "password" | "supabase";

export function getExperienceStorageDriver(): ExperienceStorageDriver {
  const raw = process.env.EXPERIENCE_STORAGE_DRIVER?.trim().toLowerCase();
  return raw === "supabase" ? "supabase" : "file";
}

export function getAdminAuthMode(): AdminAuthMode {
  const raw = process.env.ADMIN_AUTH_MODE?.trim().toLowerCase();
  return raw === "supabase" ? "supabase" : "password";
}

export function isExperienceEmailEnabled(): boolean {
  return process.env.EXPERIENCE_EMAIL_ENABLED?.trim().toLowerCase() === "true";
}

export function getExperienceWebBaseUrl(): string {
  return (
    process.env.EXPERIENCE_WEB_BASE_URL?.trim() ||
    process.env.WEB_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3003"
  ).replace(/\/+$/, "");
}
