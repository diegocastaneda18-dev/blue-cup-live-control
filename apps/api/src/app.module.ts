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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UserModule,
    TournamentModule,
    TeamModule,
    CatchModule,
    LeaderboardModule
  ]
})
export class AppModule {}

