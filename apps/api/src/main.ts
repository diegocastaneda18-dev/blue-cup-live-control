import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT) || 4000;

  await app.listen(port, "0.0.0.0");

  console.log(`Blue Cup API listening on port ${port}`);
}

bootstrap();