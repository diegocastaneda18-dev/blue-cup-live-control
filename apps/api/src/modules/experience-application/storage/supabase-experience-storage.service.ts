import { Injectable, Logger } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { logExperienceSupabase } from "../lib/experience-supabase-log";
import { getSupabaseAdminClient } from "../lib/supabase-admin.client";
import {
  supabaseLicenseObjectPath
} from "./experience-storage-paths";
import type { ExperienceStorage } from "./experience-storage.interface";

const DOCUMENTS_BUCKET = "experience-documents";
const LICENSES_BUCKET = "experience-licenses";

function parseRelativePath(relativePath: string): { bucket: string; objectPath: string } {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized.startsWith("licenses/")) {
    const rest = normalized.slice("licenses/".length);
    const folio = rest.split("/")[0];
    return {
      bucket: LICENSES_BUCKET,
      objectPath: supabaseLicenseObjectPath(folio)
    };
  }

  if (normalized.startsWith("uploads/")) {
    const rest = normalized.slice("uploads/".length);
    const slashIndex = rest.indexOf("/");
    if (slashIndex < 0) {
      return { bucket: DOCUMENTS_BUCKET, objectPath: rest };
    }
    const folio = rest.slice(0, slashIndex);
    const fileName = rest.slice(slashIndex + 1);
    return { bucket: DOCUMENTS_BUCKET, objectPath: `${folio}/${fileName}` };
  }

  return { bucket: DOCUMENTS_BUCKET, objectPath: normalized };
}

@Injectable()
export class SupabaseExperienceStorageService implements ExperienceStorage {
  private readonly logger = new Logger(SupabaseExperienceStorageService.name);
  private readonly tempDir = path.join(os.tmpdir(), "lme-experience-storage");

  private async ensureTempDir(): Promise<void> {
    await mkdir(this.tempDir, { recursive: true });
  }

  async saveBinary(relativePath: string, buffer: Buffer, contentType?: string): Promise<void> {
    const { bucket, objectPath } = parseRelativePath(relativePath);
    const client = getSupabaseAdminClient();
    const { error } = await client.storage.from(bucket).upload(objectPath, buffer, {
      upsert: true,
      contentType: contentType ?? "application/octet-stream"
    });

    if (error) {
      this.logger.error(`Storage upload failed (${bucket}/${objectPath}): ${error.message}`);
      throw new Error(`No se pudo guardar el archivo: ${error.message}`);
    }

    if (bucket === LICENSES_BUCKET) {
      logExperienceSupabase("save license PDF", {
        bucket,
        objectPath,
        bytes: buffer.length
      });
    } else {
      logExperienceSupabase("upload document", {
        bucket,
        objectPath,
        bytes: buffer.length
      });
    }
  }

  async resolveAbsolutePath(relativePath: string): Promise<string> {
    const { bucket, objectPath } = parseRelativePath(relativePath);
    const client = getSupabaseAdminClient();
    const { data, error } = await client.storage.from(bucket).download(objectPath);

    if (error || !data) {
      throw new Error(`Archivo no encontrado en storage (${bucket}/${objectPath}).`);
    }

    await this.ensureTempDir();
    const safeName = relativePath.replace(/[^a-zA-Z0-9._-]/g, "-");
    const tempPath = path.join(this.tempDir, `${Date.now()}-${safeName}`);
    const buffer = Buffer.from(await data.arrayBuffer());
    await writeFile(tempPath, buffer);

    logExperienceSupabase("download file", { bucket, objectPath, tempPath });
    return tempPath;
  }

  async resolveWritablePath(relativePath: string): Promise<string> {
    await this.ensureTempDir();
    const safeName = relativePath.replace(/[^a-zA-Z0-9._-]/g, "-");
    return path.join(this.tempDir, `write-${Date.now()}-${safeName}`);
  }
}
