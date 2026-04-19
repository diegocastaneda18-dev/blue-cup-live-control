import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ReviewAction } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LeaderboardGateway } from "../leaderboard/leaderboard.gateway";

@Injectable()
export class CatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly leaderboard: LeaderboardGateway
  ) {}

  private async assertUserCanAccessCatch(params: { userId: string; catchId: string; allowCommittee: boolean }) {
    const c = await this.prisma.catch.findUnique({ where: { id: params.catchId } });
    if (!c) throw new NotFoundException("Catch not found");
    if (c.createdById === params.userId) return c;
    if (!params.allowCommittee) throw new ForbiddenException("Not allowed");
    return c;
  }

  private computeScore(rule: { basePoints: number; weightKgMultiplier: number; lengthCmPointsPerCm: number }, c: {
    weightKg?: number | null;
    lengthCm?: number | null;
  }) {
    const weight = c.weightKg ?? 0;
    const length = c.lengthCm ?? 0;
    return rule.basePoints + rule.weightKgMultiplier * weight + rule.lengthCmPointsPerCm * length;
  }

  async submitCatch(params: {
    tournamentId: string;
    categoryId: string;
    speciesId?: string;
    type: "release" | "weigh_in";
    occurredAtClient?: Date;
    weightKg?: number;
    lengthCm?: number;
    notes?: string;
    actorId: string;
  }) {
    const membership = await this.prisma.teamMember.findFirst({ where: { userId: params.actorId } });
    if (!membership) throw new ForbiddenException("User is not part of a team");
    const team = await this.prisma.team.findUnique({ where: { id: membership.teamId } });
    if (!team) throw new ForbiddenException("Team not found");
    if (team.tournamentId !== params.tournamentId) throw new BadRequestException("Team is not in tournament");

    const scoringRule = await this.prisma.scoringRule.findFirst({
      where: { tournamentId: params.tournamentId, categoryId: params.categoryId, isActive: true }
    });
    if (!scoringRule) throw new BadRequestException("No scoring rule for category");

    const created = await this.prisma.catch.create({
      data: {
        tournamentId: params.tournamentId,
        teamId: team.id,
        createdById: params.actorId,
        categoryId: params.categoryId,
        speciesId: params.speciesId,
        type: params.type,
        status: "pending_review",
        occurredAtClient: params.occurredAtClient,
        weightKg: params.weightKg,
        lengthCm: params.lengthCm,
        notes: params.notes,
        scorePreliminary: 0,
        scoreOfficial: 0
      },
      include: { category: true, species: true, team: true }
    });

    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "catch.submit",
      entity: "Catch",
      entityId: created.id,
      meta: { tournamentId: created.tournamentId, teamId: created.teamId, categoryId: created.categoryId, type: created.type }
    });

    // If media required, keep in pending_review; committee can request more evidence later too.
    if (scoringRule.requiresMedia) {
      await this.leaderboard.broadcastCatchEvent(created.tournamentId, { type: "catch_submitted", catchId: created.id });
    }

    return created;
  }

  async addMedia(params: { catchId: string; type: "photo" | "video"; objectKey: string; url: string; actorId: string }) {
    const c = await this.assertUserCanAccessCatch({ userId: params.actorId, catchId: params.catchId, allowCommittee: false });
    if (["approved", "official"].includes(c.status)) {
      throw new BadRequestException("Cannot modify media after approval/official without workflow");
    }
    const created = await this.prisma.catchMedia.create({
      data: { catchId: params.catchId, type: params.type, objectKey: params.objectKey, url: params.url }
    });
    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "catch.media.add",
      entity: "CatchMedia",
      entityId: created.id,
      meta: { catchId: params.catchId, type: params.type, objectKey: params.objectKey }
    });
    return created;
  }

  private catchDetailInclude() {
    return {
      media: true,
      category: true,
      species: true,
      reviews: {
        orderBy: { createdAt: "desc" as const },
        include: { reviewer: { select: { id: true, displayName: true, email: true } } }
      }
    };
  }

  async myCatchHistory(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({ where: { userId } });
    if (!membership) throw new NotFoundException("No team membership");
    return this.prisma.catch.findMany({
      where: { teamId: membership.teamId },
      include: this.catchDetailInclude(),
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async getCatchForTeamMember(userId: string, catchId: string) {
    const membership = await this.prisma.teamMember.findFirst({ where: { userId } });
    if (!membership) throw new NotFoundException("No team membership");
    const c = await this.prisma.catch.findFirst({
      where: { id: catchId, teamId: membership.teamId },
      include: this.catchDetailInclude()
    });
    if (!c) throw new NotFoundException("Catch not found");
    return c;
  }

  async listPendingForCommittee(tournamentId: string) {
    return this.prisma.catch.findMany({
      where: { tournamentId, status: { in: ["pending_review", "more_evidence_required"] } },
      include: { team: true, category: true, species: true, media: true },
      orderBy: { createdAt: "asc" },
      take: 100
    });
  }

  async reviewCatch(params: {
    catchId: string;
    reviewerId: string;
    action: "approve" | "reject" | "request_more_evidence" | "penalize";
    notes?: string;
    penaltyPoints?: number;
  }) {
    const c = await this.prisma.catch.findUnique({
      where: { id: params.catchId },
      include: { tournament: true, media: true }
    });
    if (!c) throw new NotFoundException("Catch not found");

    const scoringRule = await this.prisma.scoringRule.findFirst({
      where: { tournamentId: c.tournamentId, categoryId: c.categoryId, isActive: true }
    });
    if (!scoringRule) throw new BadRequestException("No scoring rule for category");

    if (params.action === "approve" && scoringRule.requiresMedia && c.media.length === 0) {
      throw new BadRequestException("Media evidence required for this catch type/category");
    }
    if (params.action === "penalize" && (params.penaltyPoints == null || params.penaltyPoints <= 0)) {
      throw new BadRequestException("penaltyPoints required for penalize");
    }

    const reviewActionMap: Record<string, ReviewAction> = {
      approve: ReviewAction.approve,
      reject: ReviewAction.reject,
      request_more_evidence: ReviewAction.request_more_evidence,
      penalize: ReviewAction.penalize
    };

    const score = this.computeScore(scoringRule, c);

    const nextStatus: Prisma.CatchUpdateInput["status"] =
      params.action === "approve"
        ? "approved"
        : params.action === "reject"
          ? "rejected"
          : params.action === "request_more_evidence"
            ? "more_evidence_required"
            : "penalized";

    const updated = await this.prisma.$transaction(async (tx) => {
      const review = await tx.catchReview.create({
        data: {
          catchId: c.id,
          reviewerId: params.reviewerId,
          action: reviewActionMap[params.action],
          notes: params.notes,
          penaltyPoints: params.penaltyPoints
        }
      });

      const updatedCatch = await tx.catch.update({
        where: { id: c.id },
        data: {
          status: nextStatus,
          scorePreliminary: params.action === "approve" ? score : c.scorePreliminary,
          // Official is only set by admin export/lock flow in this MVP
          scoreOfficial: c.scoreOfficial
        }
      });

      return { review, updatedCatch };
    });

    await this.audit.log({
      ctx: { actorId: params.reviewerId },
      action: "catch.review",
      entity: "Catch",
      entityId: c.id,
      meta: {
        action: params.action,
        nextStatus,
        scorePreliminary: updated.updatedCatch.scorePreliminary,
        penaltyPoints: params.penaltyPoints ?? null
      }
    });

    await this.leaderboard.broadcastLeaderboardRefresh(c.tournamentId);

    return updated;
  }

  async markOfficial(params: { catchId: string; actorId: string }) {
    const c = await this.prisma.catch.findUnique({ where: { id: params.catchId } });
    if (!c) throw new NotFoundException("Catch not found");
    if (c.status !== "approved") throw new BadRequestException("Only approved catches can be marked official");

    const updated = await this.prisma.catch.update({
      where: { id: c.id },
      data: { status: "official", scoreOfficial: c.scorePreliminary }
    });

    await this.audit.log({
      ctx: { actorId: params.actorId },
      action: "catch.markOfficial",
      entity: "Catch",
      entityId: updated.id,
      meta: { scoreOfficial: updated.scoreOfficial }
    });

    await this.leaderboard.broadcastLeaderboardRefresh(updated.tournamentId);

    return updated;
  }
}

