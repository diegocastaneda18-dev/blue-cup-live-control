/** Format YYYY-MM-DD strings as local calendar dates (avoids UTC timezone shift). */
export function formatDateOnly(dateString?: string | null): string {
  if (!dateString) return "—";
  const datePart = dateString.split("T")[0] ?? dateString;
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

/** ISO timestamps with time — shown in local timezone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}
