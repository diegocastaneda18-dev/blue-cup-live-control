import type {
  CreateExperienceApplicationPayload,
  CreateExperienceApplicationResponse
} from "@bluecup/types";
import { experienceTypes, type ExperienceTypeId } from "./brand";
import { getPublicApiBaseUrl } from "./env";

export type WizardFormState = {
  experienceTypes: ExperienceTypeId[];
  activityPlace: string;
  activityLat: string;
  activityLng: string;
  arrivalDate: string;
  departureDate: string;
  entryPort: string;
  exitPort: string;
  itinerarySummary: string;
  routeName: string;
  routeFrom: string;
  routeTo: string;
  routeNotes: string;
  transportType: "vessel" | "aircraft" | "both" | "none";
  vesselName: string;
  vesselRegistration: string;
  vesselLengthM: string;
  aircraftType: string;
  aircraftRegistration: string;
  transportNotes: string;
  guestsTotal: string;
  guestsAdults: string;
  guestsChildren: string;
  guestsCrew: string;
  guestNames: string;
  lodgingPreference: string;
  lodgingNights: string;
  lodgingRooms: string;
  lodgingNotes: string;
  dietaryRestrictions: string;
  foodPreferences: string;
  foodSpecialRequests: string;
  observations: string;
  budgetRange: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  nationality: string;
  termsAccepted: boolean;
  responsibleSignature: string;
};

export const INITIAL_WIZARD_FORM: WizardFormState = {
  experienceTypes: [],
  activityPlace: "",
  activityLat: "",
  activityLng: "",
  arrivalDate: "",
  departureDate: "",
  entryPort: "",
  exitPort: "",
  itinerarySummary: "",
  routeName: "",
  routeFrom: "",
  routeTo: "",
  routeNotes: "",
  transportType: "none",
  vesselName: "",
  vesselRegistration: "",
  vesselLengthM: "",
  aircraftType: "",
  aircraftRegistration: "",
  transportNotes: "",
  guestsTotal: "2",
  guestsAdults: "",
  guestsChildren: "",
  guestsCrew: "",
  guestNames: "",
  lodgingPreference: "",
  lodgingNights: "",
  lodgingRooms: "",
  lodgingNotes: "",
  dietaryRestrictions: "",
  foodPreferences: "",
  foodSpecialRequests: "",
  observations: "",
  budgetRange: "",
  fullName: "",
  email: "",
  phone: "",
  company: "",
  nationality: "",
  termsAccepted: false,
  responsibleSignature: ""
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalInt(value: string): number | undefined {
  const n = parseOptionalNumber(value);
  if (n == null) return undefined;
  return Math.trunc(n);
}

export function buildExperienceApplicationPayload(
  form: WizardFormState
): CreateExperienceApplicationPayload {
  const typeLabels = new Map(experienceTypes.map((t) => [t.id, t.label]));
  const activityItems = form.experienceTypes.map((id) => ({
    name: typeLabels.get(id) ?? id,
    place: form.activityPlace.trim() || null,
    latitude: parseOptionalNumber(form.activityLat) ?? null,
    longitude: parseOptionalNumber(form.activityLng) ?? null,
    scheduledDate: form.arrivalDate || null
  }));

  const routes =
    form.routeName.trim().length > 0
      ? [
          {
            name: form.routeName.trim(),
            from: form.routeFrom.trim() || null,
            to: form.routeTo.trim() || null,
            coordinates:
              form.activityLat.trim() && form.activityLng.trim()
                ? [
                    {
                      latitude: parseOptionalNumber(form.activityLat) ?? null,
                      longitude: parseOptionalNumber(form.activityLng) ?? null
                    }
                  ]
                : undefined,
            notes: form.routeNotes.trim() || null
          }
        ]
      : [];

  return {
    applicant: {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      company: form.company.trim() || null,
      nationality: form.nationality.trim() || null
    },
    transport: {
      type: form.transportType,
      vesselName: form.vesselName.trim() || null,
      vesselRegistration: form.vesselRegistration.trim() || null,
      vesselLengthM: parseOptionalNumber(form.vesselLengthM) ?? null,
      aircraftType: form.aircraftType.trim() || null,
      aircraftRegistration: form.aircraftRegistration.trim() || null,
      notes: form.transportNotes.trim() || null
    },
    itinerary: {
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate || null,
      entryPort: form.entryPort.trim() || null,
      exitPort: form.exitPort.trim() || null,
      summary: form.itinerarySummary.trim() || null
    },
    peopleOnBoard: {
      total: parseOptionalInt(form.guestsTotal) ?? 1,
      adults: parseOptionalInt(form.guestsAdults) ?? null,
      children: parseOptionalInt(form.guestsChildren) ?? null,
      crew: parseOptionalInt(form.guestsCrew) ?? null,
      guestNames: form.guestNames.trim() || null
    },
    activities: {
      experienceTypes: form.experienceTypes,
      items: activityItems
    },
    lodging: {
      preference: form.lodgingPreference.trim() || null,
      nights: parseOptionalInt(form.lodgingNights) ?? null,
      rooms: parseOptionalInt(form.lodgingRooms) ?? null,
      notes: form.lodgingNotes.trim() || null
    },
    food: {
      dietaryRestrictions: form.dietaryRestrictions.trim() || null,
      preferences: form.foodPreferences.trim() || null,
      specialRequests: form.foodSpecialRequests.trim() || null
    },
    requestedRoutes: routes,
    observations: form.observations.trim() || null,
    attachments: [],
    termsAccepted: form.termsAccepted,
    responsibleSignature: form.responsibleSignature.trim(),
    budgetRange: form.budgetRange || null
  };
}

/** Submit URL for experience applications wizard. */
export function getExperienceApplicationsSubmitUrl(): string {
  return `${getPublicApiBaseUrl()}/api/experience-applications`;
}

export async function submitExperienceApplication(
  payload: CreateExperienceApplicationPayload
): Promise<CreateExperienceApplicationResponse> {
  const url = getExperienceApplicationsSubmitUrl();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Verifica que la API esté encendida."
    );
  }

  const body = (await res.json().catch(() => null)) as
    | CreateExperienceApplicationResponse
    | { message?: string | string[]; error?: string; statusCode?: number }
    | null;

  if (!res.ok) {
    const errBody = body as { message?: string | string[]; error?: string } | null;
    const msg = errBody?.message;
    if (Array.isArray(msg) && msg.length > 0) {
      throw new Error(msg.join(". "));
    }
    if (typeof msg === "string" && msg.trim()) {
      throw new Error(msg.trim());
    }
    throw new Error(
      errBody?.error?.trim() || `Error al enviar la solicitud (${res.status}).`
    );
  }

  if (!body || !("folio" in body)) {
    throw new Error("Respuesta inválida del servidor.");
  }

  return body;
}

export function validateWizardStep(step: number, form: WizardFormState): string | null {
  if (step === 0 && form.experienceTypes.length === 0) {
    return "Selecciona al menos una experiencia.";
  }
  if (step === 1) {
    if (!form.arrivalDate) return "Indica la fecha de ingreso.";
    if (form.departureDate && form.departureDate < form.arrivalDate) {
      return "La fecha de salida no puede ser anterior al ingreso.";
    }
  }
  if (step === 2) {
    const total = parseOptionalInt(form.guestsTotal);
    if (!total || total < 1) return "Indica el número total de personas a bordo.";
    if (form.transportType === "vessel" || form.transportType === "both") {
      if (!form.vesselName.trim()) return "Indica el nombre de la embarcación.";
    }
    if (form.transportType === "aircraft" || form.transportType === "both") {
      if (!form.aircraftType.trim()) return "Indica el tipo de aeronave.";
    }
  }
  if (step === 4) {
    if (!form.fullName.trim()) return "Tu nombre completo es requerido.";
    if (!form.email.trim() || !form.email.includes("@")) return "Ingresa un email válido.";
    if (!form.phone.trim()) return "Indica teléfono o WhatsApp.";
    if (!form.termsAccepted) return "Debes aceptar los términos y condiciones.";
    if (!form.responsibleSignature.trim()) return "Indica tu nombre como firma del responsable.";
  }
  return null;
}
