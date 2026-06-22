import Image from "next/image";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";
import { brandAssets } from "@/lib/brand";

type ValidationResponse = {
  folio: string;
  status: string;
  applicantName: string;
  transportType?: string;
  vesselName?: string | null;
  aircraftRegistration?: string | null;
  authorizedDates?: {
    arrival: string;
    departure: string | null;
  };
  authorizedActivities?: string[];
  licenseIssuedAt?: string | null;
  message: string;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "long" }).format(date);
}

async function fetchValidation(folio: string): Promise<ValidationResponse | null> {
  const apiBaseUrl = getNestApiBaseUrl();
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/license/validation`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    return (await response.json()) as ValidationResponse;
  } catch {
    return null;
  }
}

export default async function ValidateLicensePage({
  params
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio } = await params;
  const data = await fetchValidation(folio);

  return (
    <main className="min-h-screen bg-maria-sand-light px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-maria-soft ring-1 ring-maria-forest/10">
        <div className="flex items-center gap-4 border-b border-maria-forest/10 pb-6">
          <Image
            src={brandAssets.logo}
            alt="Las Marías Experience"
            width={72}
            height={72}
            className="h-16 w-16 object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-maria-ocean">
              Las Marías Experience
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-maria-forest">Validación de licencia</h1>
          </div>
        </div>

        {!data ? (
          <p className="mt-6 text-sm text-maria-forest/70">
            No se encontró una licencia emitida para el folio {folio}.
          </p>
        ) : (
          <dl className="mt-6 space-y-4 text-sm text-maria-forest-dark">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">Folio</dt>
              <dd className="mt-1 font-mono text-base font-semibold">{data.folio}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">Estatus</dt>
              <dd className="mt-1 capitalize">{data.status.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">Solicitante</dt>
              <dd className="mt-1">{data.applicantName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">
                Fechas autorizadas
              </dt>
              <dd className="mt-1">
                {formatDate(data.authorizedDates?.arrival)}
                {data.authorizedDates?.departure
                  ? ` → ${formatDate(data.authorizedDates.departure)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">Actividades</dt>
              <dd className="mt-1">
                {data.authorizedActivities?.length
                  ? data.authorizedActivities.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-maria-forest/50">
                Fecha de emisión
              </dt>
              <dd className="mt-1">{formatDate(data.licenseIssuedAt)}</dd>
            </div>
            <div className="rounded-2xl bg-maria-sand-light px-4 py-3 text-maria-forest/80">
              {data.message}
            </div>
          </dl>
        )}
      </div>
    </main>
  );
}
