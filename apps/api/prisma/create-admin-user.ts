import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const EMAIL = "admin@bluecup.local";
const PASSWORD = "ChangeMe123!";

async function main() {
  const passwordHash = await argon2.hash(PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      displayName: "Admin",
      role: Role.admin,
      passwordHash,
      isActive: true
    },
    create: {
      email: EMAIL,
      displayName: "Admin",
      role: Role.admin,
      passwordHash,
      isActive: true
    }
  });
  // eslint-disable-next-line no-console
  console.log("Admin user ready:", { id: user.id, email: user.email, role: user.role });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
