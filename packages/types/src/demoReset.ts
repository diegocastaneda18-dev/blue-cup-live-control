const PREFIX = "bluecup_demo_";

/** Clears demo-scoped client state and reloads the app (admin "Reset demo data"). */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}
