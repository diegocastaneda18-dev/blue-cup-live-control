import { Logger } from "@nestjs/common";

const logger = new Logger("ExperienceSupabase");

export function logExperienceSupabase(
  action: string,
  detail?: Record<string, string | number | undefined | null>
): void {
  const suffix =
    detail && Object.keys(detail).length
      ? ` ${Object.entries(detail)
          .filter(([, value]) => value != null && value !== "")
          .map(([key, value]) => `${key}=${value}`)
          .join(" ")}`
      : "";
  logger.log(`[Experience Supabase] ${action}${suffix}`);
}
