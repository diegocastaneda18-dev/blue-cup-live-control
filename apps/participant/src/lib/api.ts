const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export type ApiError = { message: string; status?: number; details?: unknown };

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("bluecup_access_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("bluecup_access_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("bluecup_access_token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text();
    }
    throw { message: "API request failed", status: res.status, details: payload } satisfies ApiError;
  }
  return (await res.json()) as T;
}

