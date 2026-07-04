import { Module } from "@nestjs/common";
import { JackpotsController } from "./jackpots.controller";
import { JackpotsService } from "./jackpots.service";

@Module({
  controllers: [JackpotsController],
  providers: [JackpotsService],
  exports: [JackpotsService]
})
export class JackpotsModule {}
