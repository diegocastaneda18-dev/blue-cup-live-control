import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [AuditModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

