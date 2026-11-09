import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TeamController } from "./team.controller";
import { TeamService } from "./team.service";
import { RegistrationSyncController } from "./registration-sync.controller";

@Module({
  imports: [AuditModule],
  controllers: [TeamController, RegistrationSyncController],
  providers: [TeamService],
  exports: [TeamService]
})
export class TeamModule {}

