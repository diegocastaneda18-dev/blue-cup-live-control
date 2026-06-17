export type ExperienceApplicationStatus =
  | "recibida"
  | "en_revision"
  | "informacion_incompleta"
  | "aprobada"
  | "rechazada"
  | "licencia_emitida";

export type ExperienceTransportType = "vessel" | "aircraft" | "both" | "none";

export type ExperienceApplicant = {
  fullName: string;
  email: string;
  phone: string;
  company?: string | null;
  nationality?: string | null;
};

export type ExperienceTransport = {
  type: ExperienceTransportType;
  vesselName?: string | null;
  vesselRegistration?: string | null;
  vesselLengthM?: number | null;
  aircraftType?: string | null;
  aircraftRegistration?: string | null;
  notes?: string | null;
};

export type ExperienceItinerary = {
  arrivalDate: string;
  departureDate?: string | null;
  entryPort?: string | null;
  exitPort?: string | null;
  summary?: string | null;
};

export type ExperiencePeopleOnBoard = {
  total: number;
  adults?: number | null;
  children?: number | null;
  crew?: number | null;
  guestNames?: string | null;
};

export type ExperienceActivityItem = {
  name: string;
  place?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scheduledDate?: string | null;
};

export type ExperienceActivities = {
  experienceTypes: string[];
  items: ExperienceActivityItem[];
};

export type ExperienceLodging = {
  preference?: string | null;
  nights?: number | null;
  rooms?: number | null;
  notes?: string | null;
};

export type ExperienceFood = {
  dietaryRestrictions?: string | null;
  preferences?: string | null;
  specialRequests?: string | null;
};

export type ExperienceRoutePoint = {
  latitude?: number | null;
  longitude?: number | null;
};

export type ExperienceRequestedRoute = {
  name: string;
  from?: string | null;
  to?: string | null;
  coordinates?: ExperienceRoutePoint[];
  notes?: string | null;
};

export type ExperienceAttachment = {
  fileName: string;
  url?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

export type ExperienceDocumentStatus = "pendiente" | "aprobado" | "rechazado" | "incompleto";

export type ExperienceApplicationDocument = {
  id: string;
  type: string;
  label: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  relativePath: string;
  uploadedAt: string;
  status: ExperienceDocumentStatus;
  adminNote?: string;
  reviewedAt?: string;
};

export type ExperienceDocumentType =
  | "vessel_registration"
  | "vessel_insurance"
  | "vessel_safety_certificate"
  | "vessel_departure_authorization"
  | "owner_id"
  | "captain_id"
  | "passenger_list"
  | "route_map"
  | "aircraft_registration"
  | "aircraft_insurance"
  | "aircraft_operational_docs"
  | "pilot_id"
  | "flight_plan"
  | "passenger_id"
  | "other";

export type ExperienceStatusHistoryEntry = {
  status: ExperienceApplicationStatus;
  changedAt: string;
  note?: string | null;
};

export type CreateExperienceApplicationPayload = {
  applicant: ExperienceApplicant;
  transport: ExperienceTransport;
  itinerary: ExperienceItinerary;
  peopleOnBoard: ExperiencePeopleOnBoard;
  activities: ExperienceActivities;
  lodging: ExperienceLodging;
  food: ExperienceFood;
  requestedRoutes: ExperienceRequestedRoute[];
  observations?: string | null;
  attachments?: ExperienceAttachment[];
  termsAccepted: boolean;
  responsibleSignature: string;
  budgetRange?: string | null;
};

export type ExperienceApplicationRecord = CreateExperienceApplicationPayload & {
  id: string;
  folio: string;
  status: ExperienceApplicationStatus;
  internalNote?: string | null;
  documents?: ExperienceApplicationDocument[];
  statusHistory?: ExperienceStatusHistoryEntry[];
  licenseIssuedAt?: string;
  licensePdfPath?: string;
  licenseUrl?: string;
  qrValidationUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateExperienceApplicationResponse = {
  id: string;
  folio: string;
  status: ExperienceApplicationStatus;
  createdAt: string;
  applicant: Pick<ExperienceApplicant, "fullName" | "email">;
  itinerary: Pick<ExperienceItinerary, "arrivalDate" | "departureDate">;
};

export type UpdateExperienceApplicationStatusPayload = {
  status: ExperienceApplicationStatus;
  internalNote?: string | null;
  adminOverride?: boolean;
};

export type UpdateExperienceApplicationStatusResponse = {
  folio: string;
  status: ExperienceApplicationStatus;
  internalNote?: string | null;
  updatedAt: string;
};

export type LicenseValidationResponse = {
  folio: string;
  status: ExperienceApplicationStatus;
  applicantName: string;
  authorizedDates: {
    arrival: string;
    departure: string | null;
  };
  authorizedActivities: string[];
  licenseIssuedAt?: string | null;
  message: string;
};

export type GenerateLicenseResponse = {
  folio: string;
  status: ExperienceApplicationStatus;
  licenseIssuedAt: string;
  licenseUrl: string;
  qrValidationUrl: string;
};

export type UpdateExperienceDocumentStatusPayload = {
  status: ExperienceDocumentStatus;
  adminNote?: string | null;
  reviewedAt?: string | null;
};

export type UpdateExperienceDocumentStatusResponse = ExperienceApplicationDocument;
