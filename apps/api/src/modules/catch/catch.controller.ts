import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
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

