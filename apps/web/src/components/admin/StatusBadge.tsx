import type { ExperienceApplicationStatus } from "@bluecup/types";
import { STATUS_LABELS, displayText } from "../../lib/experience-application-admin";

const STATUS_STYLES: Record<ExperienceApplicationStatus, string> = {
  recibida: "border-maria-ocean/30 bg-maria-ocean/10 text-maria-ocean-light",
  en_revision: "border-maria-gold/35 bg-maria-gold/10 text-maria-gold-light",
  informacion_incompleta: "border-maria-sunset/35 bg-maria-sunset/10 text-maria-sunset-light",
  aprobada: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  rechazada: "border-red-400/30 bg-red-400/10 text-red-100",
  licencia_emitida: "border-maria-pearl/20 bg-maria-pearl/10 text-maria-pearl"
};

export function StatusBadge({ status }: { status: ExperienceApplicationStatus | string | undefined }) {
  const safeStatus = status && status in STATUS_STYLES ? (status as ExperienceApplicationStatus) : null;
  const label = safeStatus ? STATUS_LABELS[safeStatus] : displayText(status);
  const style = safeStatus
    ? STATUS_STYLES[safeStatus]
    : "border-maria-pearl/20 bg-maria-pearl/10 text-maria-pearl";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
