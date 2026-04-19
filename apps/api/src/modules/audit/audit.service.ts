import { Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

export type AuditContext = {
  actorId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    ctx?: AuditContext;
    action: string;
    entity: string;
    entityId?: string | null;
    meta?: Record<string, unknown>;
  }) {
    const { ctx, action, entity, entityId, meta } = params;
    await this.prisma.auditLog.create({
      data: {
        actorId: ctx?.actorId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: ctx?.ip ?? null,
        userAgent: ctx?.userAgent ?? null
      }
    });
  }
}

