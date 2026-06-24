import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const site = { slotDurationMinutes: 180 };

const DEFAULT_RULES = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 2, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 3, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 4, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 5, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "14:00", enabled: true },
  { dayOfWeek: 0, startTime: "09:00", endTime: "14:00", enabled: false },
];

function parseAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", slotDurationMinutes: site.slotDurationMinutes },
    update: {},
  });

  for (const rule of DEFAULT_RULES) {
    await db.availabilityRule.upsert({
      where: { dayOfWeek: rule.dayOfWeek },
      create: rule,
      update: {},
    });
  }

  const emails = parseAdminEmails();
  const password = process.env.ADMIN_PASSWORD;

  if (emails.length > 0 && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    for (const email of emails) {
      const name = email.split("@")[0] ?? "Admin";
      await db.adminUser.upsert({
        where: { email },
        create: { email, name, passwordHash },
        update: { passwordHash },
      });
      console.log(`Admin user seeded: ${email}`);
    }
  } else {
    console.warn(
      "ADMIN_EMAILS (or ADMIN_EMAIL) and ADMIN_PASSWORD not set — skipping admin seed."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
