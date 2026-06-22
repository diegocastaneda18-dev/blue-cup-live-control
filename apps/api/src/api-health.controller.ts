import { Controller, Get } from "@nestjs/common";

@Controller("api")
export class ApiHealthController {
  @Get("health")
  health() {
    return { ok: true, service: "bluecup-api" };
  }
}
