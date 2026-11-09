import { BadRequestException, ConflictException, Controller, ForbiddenException, Headers, Post, Body } from "@nestjs/common";
import { createPublicKey, verify } from "node:crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

// Public verification key only. The signing key is stored exclusively in the Blue Cup website's server environment.
const PUBLIC_KEY = createPublicKey(`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAqjUXQC98v0pqDGNby7P9ii7QmuJEnVMOB9bKnVv3CK4=
-----END PUBLIC KEY-----`);
const TOURNAMENT_ID = "2";

type RegistrationSync = {
  registrationId: string;
  teamName: string;
  boatName?: string | null;
  division?: string | null;
  folio?: string | null;
};

@Controller("integrations/bluecup")
export class RegistrationSyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("registrations")
  async synchronize(
    @Body() body: RegistrationSync,
    @Headers("x-bluecup-timestamp") timestamp: string | undefined,
    @Headers("x-bluecup-signature") signature: string | undefined,
  ) {
    const sentAt = Number(timestamp);
    if (!Number.isSafeInteger(sentAt) || Math.abs(Date.now() - sentAt) > 5 * 60_000 || !signature || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) {
      throw new ForbiddenException("Invalid integration signature");
    }
    const payload = `${timestamp}.${JSON.stringify(body)}`;
    let isValid = false;
    try {
      isValid = verify(null, Buffer.from(payload), PUBLIC_KEY, Buffer.from(signature, "base64"));
    } catch {
      // Signature parsing failure: do not disclose key or verification details.
    }
    if (!isValid) throw new ForbiddenException("Invalid integration signature");
    if (!body || typeof body !== "object") throw new BadRequestException("Invalid registration body");

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.registrationId || "")) {
      throw new BadRequestException("Invalid registration identifier");
    }
    const name = typeof body.teamName === "string" ? body.teamName.trim() : "";
    if (name.length < 2 || name.length > 160) throw new BadRequestException("Invalid team name");
    const boatName = typeof body.boatName === "string" ? body.boatName.trim().slice(0, 160) : "";
    const division = typeof body.division === "string" ? body.division.toLowerCase() : "";
    const usesSonar = !division.includes("sin") && (division.includes("sonar") || division.includes("omni"));

    try {
      const team = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.team.findUnique({ where: { id: body.registrationId } });
        if (existing && existing.tournamentId !== TOURNAMENT_ID) {
          throw new ConflictException("Registration already linked to another tournament");
        }
        // An existing team may have been edited by the committee. Replays must never overwrite those edits.
        if (existing) return existing;
        // Case-insensitive check prevents duplicates of teams entered manually in uppercase.
        const conflictingName = await tx.team.findFirst({ where: { tournamentId: TOURNAMENT_ID, name: { equals: name, mode: "insensitive" } } });
        // Already-entered committee teams remain authoritative; never overwrite boat or scoring data.
        if (conflictingName) return conflictingName;
        const saved = await tx.team.create({ data: { id: body.registrationId, tournamentId: TOURNAMENT_ID, name, usesSonar } });
        if (boatName) {
          await tx.boat.create({ data: { teamId: saved.id, name: boatName } });
        }
        return saved;
      });
      return { ok: true, teamId: team.id, tournamentId: team.tournamentId };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Team already exists; manual reconciliation required");
      }
      throw error;
    }
  }
}
