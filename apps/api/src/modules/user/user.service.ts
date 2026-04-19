import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
  }
}

