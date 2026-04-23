import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { mkdir, writeFile } from "fs/promises";
import { dirname, extname, join } from "path";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtUser } from "@bluecup/types";
import { AddCatchMediaDto } from "./dto/add-media.dto";
import { SubmitCatchDto } from "./dto/submit-catch.dto";
import { CatchService } from "./catch.service";

@Controller("catches")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatchController {
  constructor(private readonly catches: CatchService) {}

  @Post()
  @Roles("captain", "team_member")
  async submit(@Body() dto: SubmitCatchDto, @CurrentUser() user: JwtUser) {
    return this.catches.submitCatch({
      tournamentId: dto.tournamentId,
      categoryId: dto.categoryId,
      speciesId: dto.speciesId,
      type: dto.type,
      occurredAtClient: dto.occurredAtClient ? new Date(dto.occurredAtClient) : undefined,
      weightKg: dto.weightKg,
      lengthCm: dto.lengthCm,
      notes: dto.notes,
      actorId: user.sub
    });
  }

  @Post("media")
  @Roles("captain", "team_member")
  async addMedia(@Body() dto: AddCatchMediaDto, @CurrentUser() user: JwtUser) {
    return this.catches.addMedia({
      catchId: dto.catchId,
      type: dto.type,
      objectKey: dto.objectKey,
      url: dto.url,
      actorId: user.sub
    });
  }

  @Post("media/upload")
  @Roles("captain", "team_member")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 50 * 1024 * 1024 }
    })
  )
  async uploadEvidence(
    @Query("kind") kind: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
    @CurrentUser() user: JwtUser
  ) {
    if (!file?.buffer?.length) throw new BadRequestException("Missing file");
    if (kind !== "photo" && kind !== "video") {
      throw new BadRequestException("Query kind must be photo or video");
    }
    if (kind === "photo" && !file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Expected an image file");
    }
    if (kind === "video" && !file.mimetype.startsWith("video/")) {
      throw new BadRequestException("Expected a video file");
    }

    const ext = extname(file.originalname) || (kind === "photo" ? ".jpg" : ".mp4");
    const objectKey = `catch-evidence/${user.sub}/${randomUUID()}${ext}`;
    const absPath = join(process.cwd(), "uploads", objectKey);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, file.buffer);

    const port = Number(process.env.PORT) || 4000;
    const publicBase = (process.env.PUBLIC_API_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, "");
    const urlPath = objectKey.split("/").map((s) => encodeURIComponent(s)).join("/");
    const url = `${publicBase}/uploads/${urlPath}`;

    return { objectKey, url };
  }

  @Get("me")
  @Roles("captain", "team_member")
  async myHistory(@CurrentUser() user: JwtUser) {
    return this.catches.myCatchHistory(user.sub);
  }

  @Get(":catchId")
  @Roles("captain", "team_member")
  async getOne(@Param("catchId") catchId: string, @CurrentUser() user: JwtUser) {
    return this.catches.getCatchForTeamMember(user.sub, catchId);
  }

  @Patch(":catchId/official")
  @Roles("admin")
  async markOfficial(@Param("catchId") catchId: string, @CurrentUser() user: JwtUser) {
    return this.catches.markOfficial({ catchId, actorId: user.sub });
  }
}

