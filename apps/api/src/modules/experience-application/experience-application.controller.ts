import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";
import { CreateExperienceApplicationDto } from "./dto/create-experience-application.dto";
import { UpdateExperienceApplicationStatusDto } from "./dto/update-experience-application-status.dto";
import { UpdateExperienceDocumentStatusDto } from "./dto/update-experience-document-status.dto";
import { MAX_DOCUMENT_SIZE_BYTES } from "./document.constants";
import { ExperienceApplicationService } from "./experience-application.service";
import { AdminAccessGuard } from "./guards/admin-access.guard";

@Controller("api/experience-applications")
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  })
)
export class ExperienceApplicationController {
  constructor(private readonly applications: ExperienceApplicationService) {}

  @Post()
  create(@Body() dto: CreateExperienceApplicationDto) {
    console.log("Experience application received", dto);
    return this.applications.create(dto);
  }

  @UseGuards(AdminAccessGuard)
  @Get()
  list() {
    return this.applications.list();
  }

  @UseGuards(AdminAccessGuard)
  @Patch(":folio/status")
  updateStatus(@Param("folio") folio: string, @Body() dto: UpdateExperienceApplicationStatusDto) {
    console.log("Experience application status update", { folio, ...dto });
    return this.applications.updateStatus(
      folio,
      dto.status,
      dto.internalNote ?? null,
      dto.adminOverride ?? false
    );
  }

  @Post(":folio/documents")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES }
    })
  )
  uploadDocument(
    @Param("folio") folio: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body("documentType") documentType: string,
    @Body("label") label: string
  ) {
    return this.applications.uploadDocument(folio, file, documentType, label ?? "");
  }

  @UseGuards(AdminAccessGuard)
  @Get(":folio/documents/:documentId/download")
  async downloadDocument(
    @Param("folio") folio: string,
    @Param("documentId") documentId: string
  ): Promise<StreamableFile> {
    const { document, absolutePath } = await this.applications.getDocumentFile(folio, documentId);
    const stream = createReadStream(absolutePath);
    return new StreamableFile(stream, {
      type: document.mimeType,
      disposition: `inline; filename="${encodeURIComponent(document.originalName)}"`
    });
  }

  @UseGuards(AdminAccessGuard)
  @Patch(":folio/documents/:documentId/status")
  updateDocumentStatus(
    @Param("folio") folio: string,
    @Param("documentId") documentId: string,
    @Body() dto: UpdateExperienceDocumentStatusDto
  ) {
    return this.applications.updateDocumentStatus(
      folio,
      documentId,
      dto.status,
      dto.adminNote ?? null
    );
  }

  @UseGuards(AdminAccessGuard)
  @Post(":folio/license")
  generateLicense(@Param("folio") folio: string) {
    return this.applications.generateLicense(folio);
  }

  @UseGuards(AdminAccessGuard)
  @Get(":folio/license/download")
  async downloadLicense(@Param("folio") folio: string): Promise<StreamableFile> {
    const { absolutePath, fileName } = await this.applications.getLicenseFile(folio);
    const stream = createReadStream(absolutePath);
    return new StreamableFile(stream, {
      type: "application/pdf",
      disposition: `inline; filename="${encodeURIComponent(fileName)}"`
    });
  }

  @Get(":folio/license/validation")
  validateLicense(@Param("folio") folio: string) {
    return this.applications.validateLicense(folio);
  }

  @UseGuards(AdminAccessGuard)
  @Get(":folio")
  async getByFolio(@Param("folio") folio: string) {
    const record = await this.applications.getByFolio(folio);
    if (!record) throw new NotFoundException(`Solicitud ${folio} no encontrada.`);
    return record;
  }
}
