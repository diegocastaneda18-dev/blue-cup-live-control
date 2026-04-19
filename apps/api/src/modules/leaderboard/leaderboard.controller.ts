import { Controller, Get, Query } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async get(@Query("tournamentId") tournamentId: string) {
    return this.leaderboard.getLeaderboard(tournamentId);
  }
}

