import { Injectable, Logger } from "@nestjs/common";
import type {
  ExperienceApplicationDocument,
  ExperienceApplicationRecord,
  ExperienceDocumentStatus
} from "@bluecup/types";
import { logExperienceSupabase } from "../lib/experience-supabase-log";
import { getSupabaseAdminClient } from "../lib/supabase-admin.client";
import type { ExperienceApplicationRepository, IssueLicenseData } from "./experience-application.repository";
import {
  documentToRow,
  recordToRow,
  rowToDocument,
  rowToRecord,
  type ExperienceApplicationRow,
  type ExperienceDocumentRow
} from "./supabase-experience-application.mapper";

const APPLICATIONS_TABLE = "experience_applications";
const DOCUMENTS_TABLE = "experience_documents";
const STATUS_HISTORY_TABLE = "experience_status_history";

@Injectable()
export class SupabaseExperienceApplicationRepository implements ExperienceApplicationRepository {
  private readonly logger = new Logger(SupabaseExperienceApplicationRepository.name);

  private client() {
    return getSupabaseAdminClient();
  }

  private async loadDocuments(folio: string): Promise<ExperienceApplicationDocument[]> {
    const { data, error } = await this.client()
      .from(DOCUMENTS_TABLE)
      .select("*")
      .eq("application_folio", folio)
      .order("uploaded_at", { ascending: true });

    if (error) {
      this.logger.error(`Failed to load documents for ${folio}: ${error.message}`);
      throw new Error(error.message);
    }

    return (data as ExperienceDocumentRow[]).map(rowToDocument);
  }

  private async loadRecordWithDocuments(row: ExperienceApplicationRow): Promise<ExperienceApplicationRecord> {
    const documents = await this.loadDocuments(row.folio);
    return rowToRecord(row, documents);
  }

  private async appendStatusHistory(
    folio: string,
    fromStatus: string | null,
    toStatus: string,
    note?: string | null
  ): Promise<void> {
    const changedBy = process.env.ADMIN_EMAIL?.trim() || "admin";
    const { error } = await this.client().from(STATUS_HISTORY_TABLE).insert({
      application_folio: folio,
      from_status: fromStatus,
      to_status: toStatus,
      note: note?.trim() || null,
      changed_by: changedBy
    });
    if (error) {
      this.logger.warn(`Status history insert failed for ${folio}: ${error.message}`);
    } else {
      logExperienceSupabase("status history", { folio, from: fromStatus ?? "null", to: toStatus });
    }
  }

  async create(record: ExperienceApplicationRecord): Promise<ExperienceApplicationRecord> {
    const row = recordToRow(record);
    const { error } = await this.client().from(APPLICATIONS_TABLE).insert(row);
    if (error) {
      this.logger.error(`Create failed for ${record.folio}: ${error.message}`);
      throw new Error(error.message);
    }

    await this.appendStatusHistory(record.folio, null, record.status, "Solicitud creada");
    logExperienceSupabase("create application", { folio: record.folio, id: record.id });
    return record;
  }

  async findByFolio(folio: string): Promise<ExperienceApplicationRecord | null> {
    const { data, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .select("*")
      .eq("folio", folio)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;

    return this.loadRecordWithDocuments(data as ExperienceApplicationRow);
  }

  async findById(id: string): Promise<ExperienceApplicationRecord | null> {
    const { data, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;

    return this.loadRecordWithDocuments(data as ExperienceApplicationRow);
  }

  async countByYear(year: number): Promise<number> {
    const prefix = `LME-${year}-`;
    const { count, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .select("folio", { count: "exact", head: true })
      .like("folio", `${prefix}%`);

    if (error) {
      throw new Error(error.message);
    }
    return count ?? 0;
  }

  async list(): Promise<ExperienceApplicationRecord[]> {
    const { data, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ExperienceApplicationRow[];
    logExperienceSupabase("list applications", { count: rows.length });
    return Promise.all(rows.map((row) => this.loadRecordWithDocuments(row)));
  }

  async updateStatus(
    folio: string,
    status: ExperienceApplicationRecord["status"],
    internalNote?: string | null
  ): Promise<ExperienceApplicationRecord | null> {
    const existing = await this.findByFolio(folio);
    if (!existing) return null;

    const { data, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .update({
        status,
        internal_notes: internalNote?.trim() || null
      })
      .eq("folio", folio)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Update failed");
    }

    await this.appendStatusHistory(folio, existing.status, status, internalNote);
    logExperienceSupabase("update status", { folio, status });
    return this.loadRecordWithDocuments(data as ExperienceApplicationRow);
  }

  async addDocument(
    folio: string,
    document: ExperienceApplicationDocument
  ): Promise<ExperienceApplicationRecord | null> {
    const existing = await this.findByFolio(folio);
    if (!existing) return null;

    const row = documentToRow(folio, document);
    const { error } = await this.client().from(DOCUMENTS_TABLE).insert(row);
    if (error) {
      throw new Error(error.message);
    }

    logExperienceSupabase("add document record", {
      folio,
      documentId: document.id,
      storagePath: document.relativePath
    });
    return this.findByFolio(folio);
  }

  async updateDocumentStatus(
    folio: string,
    documentId: string,
    status: ExperienceDocumentStatus,
    adminNote?: string | null
  ): Promise<ExperienceApplicationDocument | null> {
    const reviewedAt = new Date().toISOString();
    const { data, error } = await this.client()
      .from(DOCUMENTS_TABLE)
      .update({
        status,
        admin_note: adminNote?.trim() || null,
        reviewed_at: reviewedAt
      })
      .eq("application_folio", folio)
      .eq("id", documentId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;

    await this.client()
      .from(APPLICATIONS_TABLE)
      .update({ updated_at: reviewedAt })
      .eq("folio", folio);

    logExperienceSupabase("update document status", { folio, documentId, status });
    return rowToDocument(data as ExperienceDocumentRow);
  }

  async issueLicense(folio: string, data: IssueLicenseData): Promise<ExperienceApplicationRecord | null> {
    const existing = await this.findByFolio(folio);
    if (!existing) return null;

    const { data: row, error } = await this.client()
      .from(APPLICATIONS_TABLE)
      .update({
        status: "licencia_emitida",
        license_issued_at: data.licenseIssuedAt,
        license_pdf_path: data.licensePdfPath,
        license_url: data.licenseUrl,
        qr_validation_url: data.qrValidationUrl
      })
      .eq("folio", folio)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "License update failed");
    }

    await this.appendStatusHistory(folio, existing.status, "licencia_emitida", "Licencia emitida");
    logExperienceSupabase("update license record", {
      folio,
      licensePdfPath: data.licensePdfPath
    });
    return this.loadRecordWithDocuments(row as ExperienceApplicationRow);
  }
}
