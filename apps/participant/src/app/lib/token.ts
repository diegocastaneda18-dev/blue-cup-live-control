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

