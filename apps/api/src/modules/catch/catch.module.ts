import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CatchController } from "./catch.controller";
import { CatchService } from "./catch.service";
import { CommitteeCatchController } from "./committee.controller";
import { LeaderboardModule } from "../leaderboard/leaderboard.module";

@Module({
  imports: [AuditModule, LeaderboardModule],
  controllers: [CatchController, CommitteeCatchController],
  providers: [CatchService],
  exports: [CatchService]
})
export class CatchModule {}

