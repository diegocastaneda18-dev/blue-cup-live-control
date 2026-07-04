import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { JackpotCategory } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type JackpotStandingRow = {
  rank: number;
  teamId: string;
  teamName: string;
  day: string;
  category: JackpotCategory;
  releaseScore: number;
  isEligible: boolean;
};

export type JackpotTierBoard = {
  tierId: string;
  name: string;
  amountUsd: number;
  sortOrder: number;
  entry: JackpotStandingRow | null;
};

export type JackpotLeaderboardResponse = {
  tournamentId: string;
  category: JackpotCategory;
  day: string;
  tiers: JackpotTierBoard[];
  standings: JackpotStandingRow[];
};

function catchDayKey(occurredAtClient: Date | null, occurredAtServer: Date): string {
  const d = occurredAtClient ?? occurredAtServer;
  return d.toISOString().slice(0, 10);
}

function releaseScore(c: { status: string; scoreOfficial: number | null; scorePreliminary: number | null }): number {
  if (c.status === "official") return c.scoreOfficial ?? 0;
  return (c.scoreOfficial ?? c.scorePreliminary) ?? 0;
}

function parseCategory(raw: string): JackpotCategory {
  const value = raw.trim().toLowerCase();
  if (value === "sonar" || value === "non_sonar") return value;
  throw new BadRequestException("category must be sonar or non_sonar");
}

@Injectable()
export class JackpotsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTiers(tournamentId: string, categoryRaw: string) {
    const category = parseCategory(categoryRaw);
    return this.prisma.jackpotTier.findMany({
      where: { tournamentId, category, isActive: true },
      orderBy: { sortOrder: "asc" }
    });
  }

  async listDays(tournamentId: string, categoryRaw: string): Promise<string[]> {
    const category = parseCategory(categoryRaw);
    const teams = await this.prisma.team.findMany({
      where: { tournamentId, usesSonar: category === "sonar" },
      select: { id: true }
    });
    const teamIds = teams.map((t) => t.id);
    if (teamIds.length === 0) return [];

    const catches = await this.prisma.catch.findMany({
      where: {
        tournamentId,
        teamId: { in: teamIds },
        type: "release",
        status: { in: ["approved", "official"] }
      },
      select: { occurredAtClient: true, occurredAtServer: true }
    });

    const days = new Set<string>();
    for (const c of catches) {
      days.add(catchDayKey(c.occurredAtClient, c.occurredAtServer));
    }
    return [...days].sort();
  }

  async getLeaderboard(tournamentId: string, categoryRaw: string, day: string): Promise<JackpotLeaderboardResponse> {
    const category = parseCategory(categoryRaw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      throw new BadRequestException("day must be YYYY-MM-DD");
    }

    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException("Tournament not found");

    const tiers = await this.prisma.jackpotTier.findMany({
      where: { tournamentId, category, isActive: true },
      orderBy: { sortOrder: "asc" }
    });

    const teams = await this.prisma.team.findMany({
      where: { tournamentId, usesSonar: category === "sonar" },
      select: { id: true, name: true }
    });

    const eligibilities = await this.prisma.teamJackpotEligibility.findMany({
      where: { tournamentId, category },
      select: { teamId: true, isEligible: true }
    });
    const eligibleByTeam = new Map(eligibilities.map((e) => [e.teamId, e.isEligible]));

    const catches = await this.prisma.catch.findMany({
      where: {
        tournamentId,
        teamId: { in: teams.map((t) => t.id) },
        type: "release",
        status: { in: ["approved", "official"] }
      },
      select: {
        teamId: true,
        occurredAtClient: true,
        occurredAtServer: true,
        status: true,
        scoreOfficial: true,
        scorePreliminary: true
      }
    });

    const totals = new Map<string, number>();
    for (const t of teams) totals.set(t.id, 0);

    for (const c of catches) {
      if (catchDayKey(c.occurredAtClient, c.occurredAtServer) !== day) continue;
      totals.set(c.teamId, (totals.get(c.teamId) ?? 0) + releaseScore(c));
    }

    const ranked = teams
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        releaseScore: totals.get(t.id) ?? 0,
        isEligible: eligibleByTeam.get(t.id) === true
      }))
      .filter((row) => row.isEligible && row.releaseScore > 0)
      .sort((a, b) => b.releaseScore - a.releaseScore);

    const standings: JackpotStandingRow[] = ranked.map((row, index) => ({
      rank: index + 1,
      teamId: row.teamId,
      teamName: row.teamName,
      day,
      category,
      releaseScore: row.releaseScore,
      isEligible: row.isEligible
    }));

    const tierBoards: JackpotTierBoard[] = tiers.map((tier) => {
      const winner = standings.find((s) => s.rank === tier.sortOrder) ?? null;
      return {
        tierId: tier.id,
        name: tier.name,
        amountUsd: tier.amountUsd,
        sortOrder: tier.sortOrder,
        entry: winner
      };
    });

    return { tournamentId, category, day, tiers: tierBoards, standings };
  }

  async listEligibility(tournamentId: string, categoryRaw: string) {
    const category = parseCategory(categoryRaw);
    const teams = await this.prisma.team.findMany({
      where: { tournamentId, usesSonar: category === "sonar" },
      select: { id: true, name: true, usesSonar: true },
      orderBy: { name: "asc" }
    });

    const rows = await this.prisma.teamJackpotEligibility.findMany({
      where: { tournamentId, category },
      include: { approvedBy: { select: { id: true, displayName: true, email: true } } }
    });
    const byTeam = new Map(rows.map((r) => [r.teamId, r]));

    return teams.map((team) => {
      const row = byTeam.get(team.id);
      return {
        teamId: team.id,
        teamName: team.name,
        usesSonar: team.usesSonar,
        category,
        isEligible: row?.isEligible ?? false,
        approvedAt: row?.approvedAt ?? null,
        approvedBy: row?.approvedBy ?? null
      };
    });
  }

  async setEligibility(params: {
    tournamentId: string;
    teamId: string;
    categoryRaw: string;
    isEligible: boolean;
    actorId: string;
  }) {
    const category = parseCategory(params.categoryRaw);
    const team = await this.prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team || team.tournamentId !== params.tournamentId) {
      throw new NotFoundException("Team not found in tournament");
    }
    const expectedSonar = category === "sonar";
    if (team.usesSonar !== expectedSonar) {
      throw new BadRequestException(
        `Team is registered as ${team.usesSonar ? "Sonar" : "Non Sonar"}; update equipment category first.`
      );
    }

    return this.prisma.teamJackpotEligibility.upsert({
      where: {
        tournamentId_teamId_category: {
          tournamentId: params.tournamentId,
          teamId: params.teamId,
          category
        }
      },
      create: {
        tournamentId: params.tournamentId,
        teamId: params.teamId,
        category,
        isEligible: params.isEligible,
        approvedById: params.actorId,
        approvedAt: params.isEligible ? new Date() : null
      },
      update: {
        isEligible: params.isEligible,
        approvedById: params.actorId,
        approvedAt: params.isEligible ? new Date() : null
      }
    });
  }

  async setTeamSonar(params: { teamId: string; usesSonar: boolean; actorId: string }) {
    const team = await this.prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) throw new NotFoundException("Team not found");

    return this.prisma.team.update({
      where: { id: params.teamId },
      data: { usesSonar: params.usesSonar }
    });
  }
}
