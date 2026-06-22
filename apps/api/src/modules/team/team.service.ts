import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway";

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly leaderboard: LeaderboardGateway
  ) {}

  async listByTournament(tournamentId: string) {
    return this.prisma.team.findMany({
      where: { tournamentId },
      include: {
        boat: true,
        members: { include: { user: true } },
        manualScoreUpdatedBy: { select: { id: true, displayName: true, email: true } }
      },
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

  async setManualScoreAdjustment(params: {
    teamId: string;
    adjustment: number;
    reason: string;
    actorId: string;
  }) {
    const existing = await this.prisma.team.findUnique({ where: { id: params.teamId } });
    if (!existing) throw new NotFoundException("Team not found");

    const team = await this.prisma.team.update({
      where: { id: params.teamId },
      data: {
        manualScoreAdjustment: params.adjustment,
        manualScoreReason: params.reason,
        manualScoreUpdatedById: params.actorId,
        manualScoreUpdatedAt: new Date()
      },
      include: {
        manualScoreUpdatedBy: { select: { id: true, displayName: true, email: true } }
      }
    });

    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "team.manualScoreAdjustment",
      entity: "Team",
      entityId: team.id,
      meta: {
        tournamentId: team.tournamentId,
        previousAdjustment: existing.manualScoreAdjustment,
        adjustment: params.adjustment,
        reason: params.reason
      }
    });

    await this.leaderboard.broadcastLeaderboardRefresh(team.tournamentId);

    return team;
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
