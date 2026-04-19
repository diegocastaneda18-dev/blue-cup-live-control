import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listByTournament(tournamentId: string) {
    return this.prisma.team.findMany({
      where: { tournamentId },
      include: { boat: true, members: { include: { user: true } } },
      orderBy: { name: "asc" }
    });
  }

  async create(params: { tournamentId: string; name: string; captainUserId?: string; actorId: string }) {
    const team = await this.prisma.team.create({
      data: { tournamentId: params.tournamentId, name: params.name, captainUserId: params.captainUserId }
    });
    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "team.create",
      entity: "Team",
      entityId: team.id,
      meta: { tournamentId: team.tournamentId, name: team.name, captainUserId: team.captainUserId }
    });
    return team;
  }

  async upsertBoat(params: { teamId: string; name: string; registry?: string; actorId: string }) {
    const existingTeam = await this.prisma.team.findUnique({ where: { id: params.teamId } });
    if (!existingTeam) throw new NotFoundException("Team not found");

    const boat = await this.prisma.boat.upsert({
      where: { teamId: params.teamId },
      create: { teamId: params.teamId, name: params.name, registry: params.registry },
      update: { name: params.name, registry: params.registry }
    });
    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "boat.upsert",
      entity: "Boat",
      entityId: boat.id,
      meta: { teamId: boat.teamId, name: boat.name, registry: boat.registry }
    });
    return boat;
  }

  async getTeamDashboardByUser(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({ where: { userId } });
    if (!membership) throw new NotFoundException("User has no team membership");

    return this.prisma.team.findUnique({
      where: { id: membership.teamId },
      include: {
        boat: true,
        tournament: true,
        members: { include: { user: { select: { id: true, displayName: true, email: true, role: true } } } },
        catches: { include: { media: true }, orderBy: { createdAt: "desc" }, take: 25 }
      }
    });
  }
}

