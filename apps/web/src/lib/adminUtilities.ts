import { publicApiUrl } from "./env";

/** Authenticated admin export: `GET /exports/:tournamentId/results.csv` */
export function resultsCsvExportUrl(tournamentId: string): string {
  return publicApiUrl(`/exports/${encodeURIComponent(tournamentId)}/results.csv`);
}
