import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TournamentController } from "./tournament.controller";
import { TournamentService } from "./tournament.service";

@Module({
  imports: [AuditModule],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService]
})
export class TournamentModule {}

