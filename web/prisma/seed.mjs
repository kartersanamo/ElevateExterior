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

const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    alt: "Clean modern home exterior after soft washing",
    category: "House Soft Washing",
    sortOrder: 0,
  },
  {
    src: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cd12?w=800&q=80",
    alt: "Freshly cleaned concrete driveway",
    category: "Driveway & Concrete",
    sortOrder: 1,
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    alt: "Restored wooden deck and patio",
    category: "Deck & Patio",
    sortOrder: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    alt: "Bright home with clean siding",
    category: "House Soft Washing",
    sortOrder: 3,
  },
  {
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    alt: "Residential property curb appeal",
    category: "Roof Cleaning",
    sortOrder: 4,
  },
  {
    src: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80",
    alt: "Outdoor living space after cleaning",
    category: "Deck & Patio",
    sortOrder: 5,
  },
];

function parseAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function seedGallery() {
  const count = await db.galleryImage.count();
  if (count > 0) {
    console.log("Gallery already seeded — skipping.");
    return;
  }

  for (const img of GALLERY_IMAGES) {
    await db.galleryImage.create({ data: img });
  }
  console.log(`Seeded ${GALLERY_IMAGES.length} gallery images.`);
}

async function backfillCustomers() {
  const bookings = await db.booking.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (const booking of bookings) {
    const email = booking.customerEmail.trim().toLowerCase();
    await db.customer.upsert({
      where: { email },
      create: {
        email,
        name: booking.customerName,
        phone: booking.customerPhone,
        address: booking.address,
        source: "booking",
      },
      update: {
        name: booking.customerName,
        phone: booking.customerPhone,
        address: booking.address,
      },
    });
  }

  if (bookings.length > 0) {
    console.log(`Backfilled ${bookings.length} customers from bookings.`);
  }
}

async function seedDefaultTemplates() {
  const count = await db.emailTemplate.count();
  if (count > 0) return;

  await db.emailTemplate.create({
    data: {
      name: "Appointment reminder",
      subject: "Reminder: your appointment on {{date}}",
      bodyHtml:
        "<p>Hi {{name}},</p><p>This is a friendly reminder about your upcoming appointment on <strong>{{date}}</strong> at <strong>{{time}}</strong>.</p><p>We look forward to seeing you at {{address}}.</p><p>— Elevate Exterior Cleaning</p>",
    },
  });

  console.log("Seeded default email template.");
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

  await seedGallery();
  await backfillCustomers();
  await seedDefaultTemplates();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
