import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });

  app.enableCors({
    origin: [
      "https://blue-cup-live-control-web.vercel.app",
      "http://localhost:3003",
      "http://localhost:3000"
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    credentials: true
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, "0.0.0.0");

  console.log(`Blue Cup API listening on port ${port}`);
}

bootstrap();