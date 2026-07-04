import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { JwtUser } from "@bluecup/types";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UpdateJackpotEligibilityDto } from "./dto/update-jackpot-eligibility.dto";
import { UpdateTeamSonarDto } from "./dto/update-team-sonar.dto";
import { JackpotsService } from "./jackpots.service";

@Controller("jackpots")
export class JackpotsController {
  constructor(private readonly jackpots: JackpotsService) {}

  @Get("tiers")
  listTiers(@Query("tournamentId") tournamentId: string, @Query("category") category: string) {
    return this.jackpots.listTiers(tournamentId, category);
  }

  @Get("days")
  listDays(@Query("tournamentId") tournamentId: string, @Query("category") category: string) {
    return this.jackpots.listDays(tournamentId, category);
  }

  @Get("leaderboard")
  getLeaderboard(
    @Query("tournamentId") tournamentId: string,
    @Query("category") category: string,
    @Query("day") day: string
  ) {
    return this.jackpots.getLeaderboard(tournamentId, category, day);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("eligibility")
  @Roles("admin")
  listEligibility(@Query("tournamentId") tournamentId: string, @Query("category") category: string) {
    return this.jackpots.listEligibility(tournamentId, category);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch("eligibility")
  @Roles("admin")
  setEligibility(@Body() dto: UpdateJackpotEligibilityDto, @CurrentUser() user: JwtUser) {
    return this.jackpots.setEligibility({
      tournamentId: dto.tournamentId,
      teamId: dto.teamId,
      categoryRaw: dto.category,
      isEligible: dto.isEligible,
      actorId: user.sub
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch("teams/:teamId/sonar")
  @Roles("admin")
  setTeamSonar(
    @Param("teamId") teamId: string,
    @Body() dto: UpdateTeamSonarDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.jackpots.setTeamSonar({ teamId, usesSonar: dto.usesSonar, actorId: user.sub });
  }
}
