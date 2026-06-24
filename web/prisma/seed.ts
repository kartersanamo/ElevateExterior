import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site-config";

const DEFAULT_RULES = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 2, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 3, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 4, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 5, startTime: "08:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "14:00", enabled: true },
  { dayOfWeek: 0, startTime: "09:00", endTime: "14:00", enabled: false },
];

async function main() {
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      slotDurationMinutes: site.slotDurationMinutes,
    },
    update: {},
  });

  for (const rule of DEFAULT_RULES) {
    await db.availabilityRule.upsert({
      where: { dayOfWeek: rule.dayOfWeek },
      create: rule,
      update: {},
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    const passwordHash = await hashPassword(password);
    await db.adminUser.upsert({
      where: { email },
      create: {
        email,
        name: "Admin",
        passwordHash,
      },
      update: {
        passwordHash,
      },
    });
    console.log(`Admin user seeded: ${email}`);
  } else {
    console.warn("ADMIN_EMAIL and ADMIN_PASSWORD not set — skipping admin seed.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
