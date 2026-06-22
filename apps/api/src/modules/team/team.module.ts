import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { LeaderboardModule } from "../leaderboard/leaderboard.module";
import { TeamController } from "./team.controller";
import { TeamService } from "./team.service";

@Module({
  imports: [AuditModule, LeaderboardModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService]
})
export class TeamModule {}

