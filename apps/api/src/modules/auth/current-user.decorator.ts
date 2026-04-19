import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtUser } from "@bluecup/types";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtUser => {
  const req = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
  return req.user;
});

