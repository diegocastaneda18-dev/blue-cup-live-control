import { Body, Controller, Post } from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { getAdminAccessPassword } from "./guards/admin-access.guard";

class VerifyAdminAccessDto {
  @IsString()
  @MinLength(1)
  password!: string;
}

/** Temporary dev login — replace with Supabase Auth. */
@Controller("api/admin")
export class AdminAccessController {
  @Post("verify-access")
  verify(@Body() dto: VerifyAdminAccessDto) {
    const expected = getAdminAccessPassword();
    if (dto.password !== expected) {
      return { ok: false as const };
    }
    return { ok: true as const };
  }
}
