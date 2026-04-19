import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtUser } from "@bluecup/types";
import { ReviewActionDto } from "./dto/review-action.dto";
import { CatchService } from "./catch.service";

@Controller("committee/catches")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("committee", "admin")
export class CommitteeCatchController {
  constructor(private readonly catches: CatchService) {}

  @Get("pending")
  async pending(@Query("tournamentId") tournamentId: string) {
    return this.catches.listPendingForCommittee(tournamentId);
  }

  @Post(":catchId/review")
  async review(@Param("catchId") catchId: string, @Body() dto: ReviewActionDto, @CurrentUser() user: JwtUser) {
    return this.catches.reviewCatch({
      catchId,
      reviewerId: user.sub,
      action: dto.action,
      notes: dto.notes,
      penaltyPoints: dto.penaltyPoints
    });
  }
}

