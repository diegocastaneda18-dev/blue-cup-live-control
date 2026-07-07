import { Injectable, Logger } from "@nestjs/common";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { extname } from "path";
import { mapS3Error } from "./storage-errors";
import {
  isCloudflareR2Endpoint,
  isStorageEnvConfigured,
  resolveForcePathStyle,
  resolvePublicMediaUrl,
  storageEndpoint
} from "./storage-env";

export class StorageOperationError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(mapped: { code: string; message: string; httpStatus: number }) {
    super(mapped.message);
    this.name = "StorageOperationError";
    this.code = mapped.code;
    this.httpStatus = mapped.httpStatus;
  }
}

export const DEFAULT_PHOTO_MAX_BYTES = 25 * 1024 * 1024;
export const DEFAULT_VIDEO_MAX_BYTES = 512 * 1024 * 1024;
export const DEFAULT_MULTIPART_PART_BYTES = 8 * 1024 * 1024;
const PRESIGN_TTL_SECONDS = 3600;

export type StorageLimits = {
  photoMaxBytes: number;
  videoMaxBytes: number;
  partBytes: number;
};

@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private client: S3Client | null = null;

  isConfigured(): boolean {
    return isStorageEnvConfigured();
  }

  limits(): StorageLimits {
    return {
      photoMaxBytes: Number(process.env.S3_PHOTO_MAX_BYTES) || DEFAULT_PHOTO_MAX_BYTES,
      videoMaxBytes: Number(process.env.S3_VIDEO_MAX_BYTES) || DEFAULT_VIDEO_MAX_BYTES,
      partBytes: Number(process.env.S3_MULTIPART_PART_BYTES) || DEFAULT_MULTIPART_PART_BYTES
    };
  }

  bucket(): string {
    const b = process.env.S3_BUCKET?.trim();
    if (!b) throw new Error("S3_BUCKET is not configured");
    return b;
  }

  providerLabel(): string {
    const endpoint = storageEndpoint();
    if (isCloudflareR2Endpoint(endpoint)) return "r2";
    if (endpoint.includes("railway")) return "railway";
    return "s3";
  }

  private getClient(): S3Client {
    if (this.client) return this.client;
    const endpoint = storageEndpoint() || undefined;
    const region = process.env.S3_REGION?.trim() || "auto";
    const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
    const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("S3 credentials are not configured");
    }
    if (!endpoint) {
      throw new Error("S3_ENDPOINT is not configured");
    }
    const forcePathStyle = resolveForcePathStyle(endpoint);
    if (isCloudflareR2Endpoint(endpoint)) {
      this.logger.log("Object storage: Cloudflare R2 (virtual-hosted style, region=auto)");
    }
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle
    });
    return this.client;
  }

  private async runStorage<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof StorageOperationError) throw err;
      const mapped = mapS3Error(err, operation);
      this.logger.error(`S3 ${operation} failed [${mapped.code}]: ${mapped.message}`);
      throw new StorageOperationError(mapped);
    }
  }

  buildObjectKey(params: { catchId: string; type: "photo" | "video"; fileName?: string; mimeType?: string }): string {
    const ext =
      extname(params.fileName ?? "") ||
      (params.mimeType?.includes("png")
        ? ".png"
        : params.mimeType?.includes("webp")
          ? ".webp"
          : params.mimeType?.includes("quicktime")
            ? ".mov"
            : params.type === "photo"
              ? ".jpg"
              : ".mp4");
    return `catch-evidence/${params.catchId}/${randomUUID()}${ext}`;
  }

  publicUrl(objectKey: string): string {
    const resolved = resolvePublicMediaUrl(objectKey);
    if (resolved) return resolved;
    if (isCloudflareR2Endpoint()) {
      this.logger.warn(
        "S3_PUBLIC_BASE_URL is required for Cloudflare R2 public media URLs (use r2.dev or a custom domain)."
      );
    }
    return objectKey;
  }

  async createPresignedPut(objectKey: string, mimeType: string): Promise<string> {
    return this.runStorage("presign_put", async () => {
      const cmd = new PutObjectCommand({
        Bucket: this.bucket(),
        Key: objectKey,
        ContentType: mimeType
      });
      return getSignedUrl(this.getClient(), cmd, { expiresIn: PRESIGN_TTL_SECONDS });
    });
  }

  async createMultipartUpload(objectKey: string, mimeType: string): Promise<string> {
    return this.runStorage("multipart_init", async () => {
      const res = await this.getClient().send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucket(),
          Key: objectKey,
          ContentType: mimeType
        })
      );
      if (!res.UploadId) {
        throw new StorageOperationError({
          httpStatus: 503,
          code: "STORAGE_MULTIPART_INIT_FAILED",
          message: "Storage did not return a multipart uploadId"
        });
      }
      return res.UploadId;
    });
  }

  async presignUploadPart(objectKey: string, uploadId: string, partNumber: number): Promise<string> {
    return this.runStorage(`presign_part_${partNumber}`, async () => {
      const cmd = new UploadPartCommand({
        Bucket: this.bucket(),
        Key: objectKey,
        UploadId: uploadId,
        PartNumber: partNumber
      });
      return getSignedUrl(this.getClient(), cmd, { expiresIn: PRESIGN_TTL_SECONDS });
    });
  }

  async completeMultipartUpload(
    objectKey: string,
    uploadId: string,
    parts: { partNumber: number; etag: string }[]
  ): Promise<void> {
    await this.runStorage("multipart_complete", async () => {
      await this.getClient().send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket(),
          Key: objectKey,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts
              .slice()
              .sort((a, b) => a.partNumber - b.partNumber)
              .map((p) => ({ ETag: p.etag, PartNumber: p.partNumber }))
          }
        })
      );
    });
  }

  async abortMultipartUpload(objectKey: string, uploadId: string): Promise<void> {
    try {
      await this.getClient().send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket(),
          Key: objectKey,
          UploadId: uploadId
        })
      );
    } catch (err) {
      this.logger.warn(`Abort multipart failed for ${objectKey}: ${String(err)}`);
    }
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.getClient().send(new HeadObjectCommand({ Bucket: this.bucket(), Key: objectKey }));
      return true;
    } catch {
      return false;
    }
  }
}
