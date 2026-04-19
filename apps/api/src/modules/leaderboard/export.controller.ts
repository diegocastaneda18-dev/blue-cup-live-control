import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { LeaderboardService } from "./leaderboard.service";

@Controller("exports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get(":tournamentId/results.csv")
  @Roles("admin")
  async results(@Param("tournamentId") tournamentId: string, @Res() res: Response) {
    const rows = await this.leaderboard.getLeaderboard(tournamentId);
    const header = ["rank", "teamName", "pointsPreliminary", "pointsOfficial"].join(",");
    const body = rows
      .map((r, idx) =>
        [idx + 1, csv(r.teamName), Number(r.pointsPreliminary).toFixed(1), Number(r.pointsOfficial).toFixed(1)].join(",")
      )
      .join("\n");
    const csvText = `${header}\n${body}\n`;

    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="bluecup-results-${tournamentId}.csv"`);
    res.status(200).send(csvText);
  }
}

function csv(v: string) {
  const needs = /[,"\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

