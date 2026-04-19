import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtUser } from "@bluecup/types";
import { CreateTournamentDto } from "./dto/create-tournament.dto";
import { SetOfficialDto } from "./dto/set-official.dto";
import { TournamentService } from "./tournament.service";

@Controller("tournaments")
export class TournamentController {
  constructor(private readonly tournaments: TournamentService) {}

  @Get()
  async list() {
    return this.tournaments.listActive();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.tournaments.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles("admin")
  async create(@Body() dto: CreateTournamentDto, @CurrentUser() user: JwtUser) {
    return this.tournaments.create({
      name: dto.name,
      location: dto.location,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      isActive: dto.isActive,
      actorId: user.sub
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(":id/official")
  @Roles("admin")
  async setOfficial(@Param("id") id: string, @Body() dto: SetOfficialDto, @CurrentUser() user: JwtUser) {
    return this.tournaments.setOfficial({ tournamentId: id, isOfficial: dto.isOfficial, actorId: user.sub });
  }
}

