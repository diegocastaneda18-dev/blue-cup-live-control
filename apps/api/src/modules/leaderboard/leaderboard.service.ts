import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type LeaderboardRow = {
  teamId: string;
  teamName: string;
  automaticScore: number;
  manualScoreAdjustment: number;
  manualScoreReason: string | null;
  finalScore: number;
  /** @deprecated use automaticScore */
  pointsPreliminary: number;
  /** @deprecated use finalScore */
  pointsOfficial: number;
};

function catchPoints(scoreOfficial: number | null, scorePreliminary: number | null): number {
  return (scoreOfficial ?? scorePreliminary) ?? 0;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(tournamentId: string): Promise<LeaderboardRow[]> {
    const teams = await this.prisma.team.findMany({
      where: { tournamentId },
      select: {
        id: true,
        name: true,
        manualScoreAdjustment: true,
        manualScoreReason: true
      }
    });
    const catches = await this.prisma.catch.findMany({
      where: { tournamentId, status: { in: ["approved", "official"] } },
      select: { teamId: true, scorePreliminary: true, scoreOfficial: true }
    });

    const automaticByTeam = new Map<string, number>();
    for (const t of teams) {
      automaticByTeam.set(t.id, 0);
    }
    for (const c of catches) {
      const current = automaticByTeam.get(c.teamId);
      if (current == null) continue;
      automaticByTeam.set(c.teamId, current + catchPoints(c.scoreOfficial, c.scorePreliminary));
    }

    const rows: LeaderboardRow[] = teams.map((t) => {
      const automaticScore = automaticByTeam.get(t.id) ?? 0;
      const manualScoreAdjustment = t.manualScoreAdjustment ?? 0;
      const finalScore = automaticScore + manualScoreAdjustment;
      return {
        teamId: t.id,
        teamName: t.name,
        automaticScore,
        manualScoreAdjustment,
        manualScoreReason: t.manualScoreReason,
        finalScore,
        pointsPreliminary: automaticScore,
        pointsOfficial: finalScore
      };
    });

    return rows.sort((a, b) => b.finalScore - a.finalScore);
  }
}
