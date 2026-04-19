import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { CurrentUser } from "./current-user.decorator";
import type { JwtUser } from "@bluecup/types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login({
      email: dto.email.toLowerCase().trim(),
      password: dto.password,
      ctx: { ip: req.ip, userAgent: req.headers["user-agent"] }
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: JwtUser) {
    return { user };
  }
}

