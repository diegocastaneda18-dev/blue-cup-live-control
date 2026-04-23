import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type LeaderboardRow = {
  teamId: string;
  teamName: string;
  pointsPreliminary: number;
  pointsOfficial: number;
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(tournamentId: string): Promise<LeaderboardRow[]> {
    const teams = await this.prisma.team.findMany({ where: { tournamentId }, select: { id: true, name: true } });
    const catches = await this.prisma.catch.findMany({
      where: { tournamentId, status: { in: ["approved", "official"] } },
      select: { teamId: true, status: true, scorePreliminary: true, scoreOfficial: true }
    });

    const byTeam = new Map<string, LeaderboardRow>();
    for (const t of teams) {
      byTeam.set(t.id, { teamId: t.id, teamName: t.name, pointsPreliminary: 0, pointsOfficial: 0 });
    }
    for (const c of catches) {
      const row = byTeam.get(c.teamId);
      if (!row) continue;
      if (c.status === "approved") row.pointsPreliminary += (c.scoreOfficial ?? c.scorePreliminary) ?? 0;
      if (c.status === "official") row.pointsOfficial += c.scoreOfficial ?? 0;
    }

    return [...byTeam.values()].sort((a, b) => {
      const aScore = Math.max(a.pointsOfficial, a.pointsPreliminary);
      const bScore = Math.max(b.pointsOfficial, b.pointsPreliminary);
      return bScore - aScore;
    });
  }
}

