import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const config = app.get(ConfigService);
  const port = Number(config.get<string>("API_PORT") ?? 4000);
  const appMode = String(config.get<string>("APP_MODE") ?? process.env.NODE_ENV ?? "development");
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Blue Cup API listening on port ${port} (APP_MODE=${appMode})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

