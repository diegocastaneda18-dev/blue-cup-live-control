import { Injectable, Logger } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ExperienceApplicationDocument,
  ExperienceApplicationRecord,
  ExperienceDocumentStatus
} from "@bluecup/types";
import type { ExperienceApplicationRepository, IssueLicenseData } from "./experience-application.repository";

const DATA_DIR = path.join(process.cwd(), "data", "experience-applications");
const STORE_FILE = path.join(DATA_DIR, "applications.json");

type StoreShape = {
  applications: ExperienceApplicationRecord[];
};

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return { applications: Array.isArray(parsed.applications) ? parsed.applications : [] };
  } catch {
    return { applications: [] };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Temporary JSON-file persistence until Supabase is configured.
 * Swap provider in `experience-application.module.ts` for SupabaseExperienceApplicationRepository.
 */
@Injectable()
export class FileExperienceApplicationRepository implements ExperienceApplicationRepository {
  private readonly logger = new Logger(FileExperienceApplicationRepository.name);

  async create(record: ExperienceApplicationRecord): Promise<ExperienceApplicationRecord> {
    const store = await readStore();
    store.applications.push(record);
    await writeStore(store);
    this.logger.log(`Stored application ${record.folio} (${record.id}) in ${STORE_FILE}`);
    return record;
  }

  async findByFolio(folio: string): Promise<ExperienceApplicationRecord | null> {
    const store = await readStore();
    return store.applications.find((a) => a.folio === folio) ?? null;
  }

  async findById(id: string): Promise<ExperienceApplicationRecord | null> {
    const store = await readStore();
    return store.applications.find((a) => a.id === id) ?? null;
  }

  async countByYear(year: number): Promise<number> {
    const store = await readStore();
    const prefix = `LME-${year}-`;
    return store.applications.filter((a) => a.folio.startsWith(prefix)).length;
  }

  async list(): Promise<ExperienceApplicationRecord[]> {
    const store = await readStore();
    return [...store.applications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateStatus(
    folio: string,
    status: ExperienceApplicationRecord["status"],
    internalNote?: string | null
  ): Promise<ExperienceApplicationRecord | null> {
    const store = await readStore();
    const index = store.applications.findIndex((a) => a.folio === folio);
    if (index < 0) return null;

    const updated: ExperienceApplicationRecord = {
      ...store.applications[index],
      status,
      internalNote: internalNote?.trim() || null,
      updatedAt: new Date().toISOString()
    };
    store.applications[index] = updated;
    await writeStore(store);
    this.logger.log(`Updated ${folio} status -> ${status}`);
    return updated;
  }

  async addDocument(
    folio: string,
    document: ExperienceApplicationDocument
  ): Promise<ExperienceApplicationRecord | null> {
    const store = await readStore();
    const index = store.applications.findIndex((a) => a.folio === folio);
    if (index < 0) return null;

    const existing = store.applications[index];
    const documents = [...(existing.documents ?? []), document];
    const updated: ExperienceApplicationRecord = {
      ...existing,
      documents,
      updatedAt: new Date().toISOString()
    };
    store.applications[index] = updated;
    await writeStore(store);
    this.logger.log(`Added document ${document.id} to ${folio}`);
    return updated;
  }

  async updateDocumentStatus(
    folio: string,
    documentId: string,
    status: ExperienceDocumentStatus,
    adminNote?: string | null
  ): Promise<ExperienceApplicationDocument | null> {
    const store = await readStore();
    const index = store.applications.findIndex((a) => a.folio === folio);
    if (index < 0) return null;

    const existing = store.applications[index];
    const documents = existing.documents ?? [];
    const docIndex = documents.findIndex((d) => d.id === documentId);
    if (docIndex < 0) return null;

    const updatedDocument: ExperienceApplicationDocument = {
      ...documents[docIndex],
      status,
      adminNote: adminNote?.trim() || undefined,
      reviewedAt: new Date().toISOString()
    };
    const updatedDocuments = [...documents];
    updatedDocuments[docIndex] = updatedDocument;

    store.applications[index] = {
      ...existing,
      documents: updatedDocuments,
      updatedAt: new Date().toISOString()
    };
    await writeStore(store);
    return updatedDocument;
  }

  async issueLicense(folio: string, data: IssueLicenseData): Promise<ExperienceApplicationRecord | null> {
    const store = await readStore();
    const index = store.applications.findIndex((a) => a.folio === folio);
    if (index < 0) return null;

    const updated: ExperienceApplicationRecord = {
      ...store.applications[index],
      status: "licencia_emitida",
      licenseIssuedAt: data.licenseIssuedAt,
      licensePdfPath: data.licensePdfPath,
      licenseUrl: data.licenseUrl,
      qrValidationUrl: data.qrValidationUrl,
      updatedAt: new Date().toISOString()
    };
    store.applications[index] = updated;
    await writeStore(store);
    return updated;
  }
}
