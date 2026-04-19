import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listActive() {
    return this.prisma.tournament.findMany({ orderBy: { startsAt: "desc" } });
  }

  async getById(id: string) {
    const t = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        categories: { orderBy: { name: "asc" } },
        species: { orderBy: { name: "asc" } }
      }
    });
    if (!t) throw new NotFoundException("Tournament not found");
    return t;
  }

  async create(params: {
    name: string;
    location?: string;
    startsAt: Date;
    endsAt: Date;
    isActive?: boolean;
    actorId: string;
  }) {
    if (params.endsAt <= params.startsAt) throw new BadRequestException("endsAt must be after startsAt");
    const created = await this.prisma.tournament.create({
      data: {
        name: params.name,
        location: params.location,
        startsAt: params.startsAt,
        endsAt: params.endsAt,
        isActive: params.isActive ?? true
      }
    });
    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "tournament.create",
      entity: "Tournament",
      entityId: created.id,
      meta: { name: created.name }
    });
    return created;
  }

  async setOfficial(params: { tournamentId: string; isOfficial: boolean; actorId: string }) {
    const updated = await this.prisma.tournament.update({
      where: { id: params.tournamentId },
      data: { isOfficial: params.isOfficial }
    });
    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "tournament.setOfficial",
      entity: "Tournament",
      entityId: updated.id,
      meta: { isOfficial: updated.isOfficial }
    });
    return updated;
  }
}

