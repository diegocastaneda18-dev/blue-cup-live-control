import { Module } from "@nestjs/common";
import { LeaderboardGateway } from "./leaderboard.gateway";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";
import { ExportController } from "./export.controller";

@Module({
  controllers: [LeaderboardController, ExportController],
  providers: [LeaderboardGateway, LeaderboardService],
  exports: [LeaderboardGateway, LeaderboardService]
})
export class LeaderboardModule {}

