/** Temporary dev admin session — replace with Supabase Auth. */
const ADMIN_SESSION_KEY = "lme_admin_password";
const LEGACY_SESSION_KEY = "lme-admin-password";

export const ADMIN_UNAUTHORIZED_MESSAGE = "Sesión no autorizada. Ingresa nuevamente.";

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  const current = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (current) return current;

  const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
  if (legacy) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, legacy);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return legacy;
  }

  return null;
}

export function setAdminPassword(password: string): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, password);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminPassword());
}

export function adminAuthHeaders(): HeadersInit {
  const password = getAdminPassword();
  if (!password) return {};
  return { "x-admin-password": password };
}
