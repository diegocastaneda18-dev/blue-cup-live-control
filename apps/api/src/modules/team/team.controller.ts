import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtUser } from "@bluecup/types";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpsertBoatDto } from "./dto/upsert-boat.dto";
import { TeamService } from "./team.service";

@Controller("teams")
export class TeamController {
  constructor(private readonly teams: TeamService) {}

  @Get("tournament/:tournamentId")
  async listByTournament(@Param("tournamentId") tournamentId: string) {
    return this.teams.listByTournament(tournamentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("me/dashboard")
  @Roles("captain", "team_member")
  async myDashboard(@CurrentUser() user: JwtUser) {
    return this.teams.getTeamDashboardByUser(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles("admin")
  async create(@Body() dto: CreateTeamDto, @CurrentUser() user: JwtUser) {
    return this.teams.create({
      tournamentId: dto.tournamentId,
      name: dto.name,
      captainUserId: dto.captainUserId,
      actorId: user.sub
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post("boat")
  @Roles("admin")
  async upsertBoat(@Body() dto: UpsertBoatDto, @CurrentUser() user: JwtUser) {
    return this.teams.upsertBoat({ teamId: dto.teamId, name: dto.name, registry: dto.registry, actorId: user.sub });
  }
}

