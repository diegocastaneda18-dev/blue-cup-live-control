import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatchModule } from "./modules/catch/catch.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { TeamModule } from "./modules/team/team.module";
import { TournamentModule } from "./modules/tournament/tournament.module";
import { UserModule } from "./modules/user/user.module";
import { ExperienceApplicationModule } from "./modules/experience-application/experience-application.module";
import { ApiHealthController } from "./api-health.controller";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UserModule,
    TournamentModule,
    TeamModule,
    CatchModule,
    LeaderboardModule,
    ExperienceApplicationModule
  ],
  controllers: [HealthController, ApiHealthController]
})
export class AppModule {}

