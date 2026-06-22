/** Admin session — password (dev) or Supabase Auth (staging/prod). */
export const ADMIN_PASSWORD_KEY = "lme_admin_password";
const LEGACY_SESSION_KEY = "lme-admin-password";
export const ADMIN_SUPABASE_TOKEN_KEY = "lme_admin_supabase_access_token";
export const ADMIN_SUPABASE_EMAIL_KEY = "lme_admin_supabase_email";

export type AdminAuthMode = "password" | "supabase";

export const ADMIN_UNAUTHORIZED_MESSAGE =
  "Sesión inválida o expirada. Vuelve a iniciar sesión.";
export const ADMIN_FORBIDDEN_MESSAGE =
  "Tu correo no está autorizado como administrador.";

export type AdminSupabaseSession = {
  accessToken: string;
  email?: string | null;
};

export function getAdminAuthMode(): AdminAuthMode {
  const raw = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE?.trim().toLowerCase();
  return raw === "supabase" ? "supabase" : "password";
}

export function isSupabaseAdminAuthEnabled(): boolean {
  return getAdminAuthMode() === "supabase";
}

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  const current = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  if (current) return current;

  const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
  if (legacy) {
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, legacy);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return legacy;
  }

  return null;
}

export function getAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_SUPABASE_TOKEN_KEY);
}

export function getAdminEmail(): string | null {
  if (typeof window === "undefined") return null;
  const email = sessionStorage.getItem(ADMIN_SUPABASE_EMAIL_KEY);
  return email || null;
}

export function setAdminPassword(password: string): void {
  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SUPABASE_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_SUPABASE_EMAIL_KEY);
}

export function setAdminSupabaseSession(session: AdminSupabaseSession): void {
  sessionStorage.setItem(ADMIN_SUPABASE_TOKEN_KEY, session.accessToken);
  sessionStorage.setItem(ADMIN_SUPABASE_EMAIL_KEY, session.email ?? "");
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SUPABASE_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_SUPABASE_EMAIL_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminAccessToken() || getAdminPassword());
}

export function hasStoredSupabaseAccessToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(ADMIN_SUPABASE_TOKEN_KEY));
}

/** Prefer Supabase Bearer token; fallback to dev password header. */
export function getAdminAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token = sessionStorage.getItem(ADMIN_SUPABASE_TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
  if (password) {
    return { "x-admin-password": password };
  }

  return {};
}

/** @deprecated Use getAdminAuthHeaders */
export function adminAuthHeaders(): HeadersInit {
  return getAdminAuthHeaders();
}
