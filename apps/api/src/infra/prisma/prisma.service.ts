import { INestApplication, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  get isConnected(): boolean {
    return this.connected;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log("Connected to PostgreSQL");
    } catch (error) {
      this.connected = false;
      this.logger.error(
        "PostgreSQL unavailable — tournament/auth routes may fail. Experience applications still work. Run: pnpm db:up"
      );
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
