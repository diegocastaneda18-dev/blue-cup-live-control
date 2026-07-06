/**
 * One-time production script: reset password for the EXISTING admin user only.
 *
 * Does NOT create users. Fails if admin@bluecup.local is missing.
 *
 * Safety: set CONFIRM_RESET_ADMIN_PASSWORD=YES before running.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@bluecup.local";
const NEW_TEMP_PASSWORD = "BlueCup2026!";
const CONFIRM_ENV = "CONFIRM_RESET_ADMIN_PASSWORD";
const REQUIRED_CONFIRM_VALUE = "YES";

async function main() {
  if (process.env[CONFIRM_ENV] !== REQUIRED_CONFIRM_VALUE) {
    throw new Error(
      `Refusing to run without explicit confirmation. ` +
        `Set ${CONFIRM_ENV}=${REQUIRED_CONFIRM_VALUE} and re-run.`
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true, role: true, isActive: true }
  });

  if (!existing) {
    throw new Error(`User not found: ${ADMIN_EMAIL}. This script only updates an existing admin.`);
  }

  const passwordHash = await argon2.hash(NEW_TEMP_PASSWORD);

  const updated = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash },
    select: { id: true, email: true, role: true, isActive: true, updatedAt: true }
  });

  // eslint-disable-next-line no-console
  console.log("Admin password reset complete:", {
    id: updated.id,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
    updatedAt: updated.updatedAt.toISOString()
  });
  // eslint-disable-next-line no-console
  console.log("Temporary password was applied. Share it securely and change it after login.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
