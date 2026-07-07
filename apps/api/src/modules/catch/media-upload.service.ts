import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ObjectStorageService, StorageOperationError } from "../../infra/storage/object-storage.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
    private readonly audit: AuditService
  ) {}

  private ensureStorage() {
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException({
        message:
          "Direct object storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY (Cloudflare R2 in production).",
        code: "STORAGE_NOT_CONFIGURED",
        stage: "storage_check"
      });
    }
  }

  private throwStorage(stage: string, err: unknown): never {
    if (err instanceof StorageOperationError) {
      this.logger.error(`[media-upload:${stage}] ${err.code}: ${err.message}`);
      throw new HttpException(
        { message: err.message, code: err.code, stage },
        err.httpStatus
      );
    }
    const message = err instanceof Error ? err.message : "Storage operation failed";
    this.logger.error(`[media-upload:${stage}] ${message}`, err instanceof Error ? err.stack : undefined);
    throw new HttpException(
      { message, code: "STORAGE_OPERATION_FAILED", stage },
      503
    );
  }

  private async assertCatchAccess(catchId: string, actorId: string) {
    const c = await this.prisma.catch.findUnique({ where: { id: catchId } });
    if (!c) throw new NotFoundException("Catch not found");
    if (c.createdById !== actorId) throw new ForbiddenException("Not allowed");
    if (["approved", "official"].includes(c.status)) {
      throw new BadRequestException("Cannot upload media after approval/official");
    }
    return c;
  }

  private async getOwnedMedia(mediaId: string, actorId: string) {
    const media = await this.prisma.catchMedia.findUnique({
      where: { id: mediaId },
      include: { catch: true }
    });
    if (!media) throw new NotFoundException("Media not found");
    if (media.catch.createdById !== actorId) throw new ForbiddenException("Not allowed");
    return media;
  }

  private validateSize(type: "photo" | "video", sizeBytes: number) {
    const limits = this.storage.limits();
    const max = type === "photo" ? limits.photoMaxBytes : limits.videoMaxBytes;
    if (sizeBytes > max) {
      throw new BadRequestException(
        `${type === "photo" ? "Photo" : "Video"} exceeds limit of ${Math.round(max / (1024 * 1024))} MB`
      );
    }
  }

  async initUpload(params: {
    catchId: string;
    type: "photo" | "video";
    mimeType: string;
    sizeBytes: number;
    fileName?: string;
    actorId: string;
  }) {
    this.ensureStorage();
    await this.assertCatchAccess(params.catchId, params.actorId);
    this.validateSize(params.type, params.sizeBytes);

    if (params.type === "photo" && !params.mimeType.startsWith("image/")) {
      throw new BadRequestException("Expected an image file");
    }
    if (params.type === "video" && !params.mimeType.startsWith("video/")) {
      throw new BadRequestException("Expected a video file");
    }

    const objectKey = this.storage.buildObjectKey({
      catchId: params.catchId,
      type: params.type,
      fileName: params.fileName,
      mimeType: params.mimeType
    });
    const url = this.storage.publicUrl(objectKey);
    const uploadSessionId = randomUUID();
    const bucket = this.storage.bucket();

    if (params.type === "photo") {
      let presignedUrl: string;
      try {
        presignedUrl = await this.storage.createPresignedPut(objectKey, params.mimeType);
      } catch (err) {
        this.throwStorage("presign_put", err);
      }
      const media = await this.prisma.catchMedia.create({
        data: {
          catchId: params.catchId,
          type: params.type,
          objectKey,
          url,
          bucket,
          mimeType: params.mimeType,
          sizeBytes: params.sizeBytes,
          uploadStatus: "uploading",
          uploadSessionId,
          storageProvider: this.storage.providerLabel()
        }
      });
      await this.audit.log({
        ctx: { actorId: params.actorId },
        action: "catch.media.upload.init",
        entity: "CatchMedia",
        entityId: media.id,
        meta: { catchId: params.catchId, type: params.type, mode: "single" }
      });
      return {
        mediaId: media.id,
        mode: "single" as const,
        objectKey,
        url,
        presignedUrl,
        partSize: null,
        totalParts: null,
        uploadId: null
      };
    }

    let uploadId: string;
    try {
      uploadId = await this.storage.createMultipartUpload(objectKey, params.mimeType);
    } catch (err) {
      this.throwStorage("multipart_init", err);
    }

    const partSize = this.storage.limits().partBytes;
    const totalParts = Math.max(1, Math.ceil(params.sizeBytes / partSize));

    let media;
    try {
      media = await this.prisma.catchMedia.create({
        data: {
          catchId: params.catchId,
          type: params.type,
          objectKey,
          url,
          bucket,
          mimeType: params.mimeType,
          sizeBytes: params.sizeBytes,
          uploadStatus: "uploading",
          uploadSessionId,
          multipartUploadId: uploadId,
          storageProvider: this.storage.providerLabel()
        }
      });
    } catch (err) {
      await this.storage.abortMultipartUpload(objectKey, uploadId).catch(() => undefined);
      const message = err instanceof Error ? err.message : "Failed to save upload metadata";
      this.logger.error(`[media-upload:metadata_save] ${message}`);
      throw new BadRequestException({
        message: `Upload metadata save failed: ${message}`,
        code: "METADATA_SAVE_FAILED",
        stage: "metadata_save"
      });
    }

    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "catch.media.upload.init",
      entity: "CatchMedia",
      entityId: media.id,
      meta: { catchId: params.catchId, type: params.type, mode: "multipart", totalParts }
    });

    return {
      mediaId: media.id,
      mode: "multipart" as const,
      objectKey,
      url,
      presignedUrl: null,
      uploadId,
      partSize,
      totalParts
    };
  }

  async presignParts(mediaId: string, partNumbers: number[], actorId: string) {
    this.ensureStorage();
    const media = await this.getOwnedMedia(mediaId, actorId);
    if (media.uploadStatus !== "uploading") {
      throw new BadRequestException("Upload is not in uploading state");
    }
    if (!media.multipartUploadId) {
      throw new BadRequestException("This media upload is not multipart");
    }
    try {
      const parts = await Promise.all(
        partNumbers.map(async (partNumber) => ({
          partNumber,
          url: await this.storage.presignUploadPart(media.objectKey, media.multipartUploadId!, partNumber)
        }))
      );
      return { parts };
    } catch (err) {
      this.throwStorage("presign_parts", err);
    }
  }

  async completeUpload(mediaId: string, parts: { partNumber: number; etag: string }[] | undefined, actorId: string) {
    this.ensureStorage();
    const media = await this.getOwnedMedia(mediaId, actorId);
    if (media.uploadStatus === "ready") {
      return this.serializeMedia(media);
    }
    if (media.uploadStatus !== "uploading") {
      throw new BadRequestException(`Cannot complete upload in status ${media.uploadStatus}`);
    }

    await this.prisma.catchMedia.update({
      where: { id: mediaId },
      data: { uploadStatus: "processing", errorMessage: null }
    });

    try {
      if (media.multipartUploadId) {
        if (!parts?.length) throw new BadRequestException("parts required for multipart upload");
        await this.storage.completeMultipartUpload(media.objectKey, media.multipartUploadId, parts);
      } else {
        const exists = await this.storage.objectExists(media.objectKey);
        if (!exists) throw new BadRequestException("Object not found in storage — upload may have failed");
      }

      const updated = await this.prisma.catchMedia.update({
        where: { id: mediaId },
        data: { uploadStatus: "ready", errorMessage: null }
      });

      await this.audit.log({
        ctx: { actorId },
        action: "catch.media.upload.complete",
        entity: "CatchMedia",
        entityId: mediaId,
        meta: { catchId: media.catchId, type: media.type }
      });

      return this.serializeMedia(updated);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof StorageOperationError) {
        const message = err.message;
        await this.prisma.catchMedia.update({
          where: { id: mediaId },
          data: { uploadStatus: "failed", errorMessage: message }
        });
        this.logger.error(`[media-upload:multipart_complete] ${err.code}: ${message}`);
        throw new HttpException(
          { message, code: err.code, stage: "multipart_complete" },
          err.httpStatus
        );
      }
      const message = err instanceof Error ? err.message : "Upload completion failed";
      await this.prisma.catchMedia.update({
        where: { id: mediaId },
        data: { uploadStatus: "failed", errorMessage: message }
      });
      throw new BadRequestException({
        message,
        code: "UPLOAD_COMPLETE_FAILED",
        stage: "multipart_complete"
      });
    }
  }

  async abortUpload(mediaId: string, actorId: string) {
    this.ensureStorage();
    const media = await this.getOwnedMedia(mediaId, actorId);
    if (media.multipartUploadId) {
      await this.storage.abortMultipartUpload(media.objectKey, media.multipartUploadId);
    }
    const updated = await this.prisma.catchMedia.update({
      where: { id: mediaId },
      data: { uploadStatus: "failed", errorMessage: "Upload aborted" }
    });
    await this.audit.log({
      ctx: { actorId },
      action: "catch.media.upload.abort",
      entity: "CatchMedia",
      entityId: mediaId,
      meta: { catchId: media.catchId }
    });
    return this.serializeMedia(updated);
  }

  async getStatus(mediaId: string, actorId: string) {
    const media = await this.getOwnedMedia(mediaId, actorId);
    return this.serializeMedia(media);
  }

  async retryUpload(mediaId: string, actorId: string) {
    this.ensureStorage();
    const media = await this.getOwnedMedia(mediaId, actorId);
    if (!["failed", "uploading"].includes(media.uploadStatus)) {
      throw new BadRequestException("Only failed or stalled uploads can be retried");
    }
    if (media.multipartUploadId) {
      await this.storage.abortMultipartUpload(media.objectKey, media.multipartUploadId);
    }

    const objectKey = this.storage.buildObjectKey({
      catchId: media.catchId,
      type: media.type as "photo" | "video",
      mimeType: media.mimeType ?? undefined
    });
    const url = this.storage.publicUrl(objectKey);
    const uploadSessionId = randomUUID();

    if (media.type === "photo") {
      let presignedUrl: string;
      try {
        presignedUrl = await this.storage.createPresignedPut(objectKey, media.mimeType ?? "image/jpeg");
      } catch (err) {
        this.throwStorage("presign_put", err);
      }
      const updated = await this.prisma.catchMedia.update({
        where: { id: mediaId },
        data: {
          objectKey,
          url,
          uploadStatus: "uploading",
          errorMessage: null,
          multipartUploadId: null,
          uploadSessionId
        }
      });
      return {
        media: this.serializeMedia(updated),
        mode: "single" as const,
        presignedUrl,
        uploadId: null,
        partSize: null,
        totalParts: null
      };
    }

    let uploadId: string;
    try {
      uploadId = await this.storage.createMultipartUpload(objectKey, media.mimeType ?? "video/mp4");
    } catch (err) {
      this.throwStorage("multipart_init", err);
    }
    const partSize = this.storage.limits().partBytes;
    const sizeBytes = media.sizeBytes ?? partSize;
    const totalParts = Math.max(1, Math.ceil(sizeBytes / partSize));
    const updated = await this.prisma.catchMedia.update({
      where: { id: mediaId },
      data: {
        objectKey,
        url,
        uploadStatus: "uploading",
        errorMessage: null,
        multipartUploadId: uploadId,
        uploadSessionId
      }
    });
    return {
      media: this.serializeMedia(updated),
      mode: "multipart" as const,
      presignedUrl: null,
      uploadId,
      partSize,
      totalParts
    };
  }

  serializeMedia(media: {
    id: string;
    catchId: string;
    type: string;
    objectKey: string;
    url: string;
    storageProvider: string;
    bucket: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
    uploadStatus: string;
    multipartUploadId: string | null;
    uploadSessionId: string | null;
    durationSeconds: number | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: media.id,
      catchId: media.catchId,
      type: media.type,
      objectKey: media.objectKey,
      url: media.url,
      storageProvider: media.storageProvider,
      bucket: media.bucket,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      uploadStatus: media.uploadStatus,
      multipartUploadId: media.multipartUploadId,
      uploadSessionId: media.uploadSessionId,
      durationSeconds: media.durationSeconds,
      errorMessage: media.errorMessage,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt
    };
  }
}
