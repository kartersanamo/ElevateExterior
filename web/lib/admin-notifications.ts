import { db } from "@/lib/db";
import type { AdminNotificationEvent } from "@prisma/client";

export type AdminNotificationCategory =
  | "inquiries"
  | "quotes"
  | "bookings"
  | "payments";

export type AdminNotificationDefinition = {
  event: AdminNotificationEvent;
  label: string;
  description: string;
  category: AdminNotificationCategory;
};

export const ADMIN_NOTIFICATION_EVENTS: AdminNotificationEvent[] = [
  "CONTACT_FORM_SUBMITTED",
  "QUOTE_REQUEST_SUBMITTED",
  "QUOTE_ACCEPTED",
  "BOOKING_REQUEST_SUBMITTED",
  "CUSTOMER_RESCHEDULED",
  "CUSTOMER_CANCELLED",
  "BOOKING_REMINDER",
  "PAYMENT_RECEIVED",
  "REVIEW_DISCOUNT_CLAIMED",
];

export const ADMIN_NOTIFICATION_DEFINITIONS: AdminNotificationDefinition[] = [
  {
    event: "CONTACT_FORM_SUBMITTED",
    label: "Contact form submitted",
    description: "Someone submits the website contact form.",
    category: "inquiries",
  },
  {
    event: "QUOTE_REQUEST_SUBMITTED",
    label: "New quote request",
    description: "A customer submits a quote request from the website.",
    category: "quotes",
  },
  {
    event: "QUOTE_ACCEPTED",
    label: "Quote accepted",
    description: "A customer accepts a quote and confirms their booking.",
    category: "quotes",
  },
  {
    event: "BOOKING_REQUEST_SUBMITTED",
    label: "New booking request",
    description: "A customer submits a direct booking request.",
    category: "bookings",
  },
  {
    event: "CUSTOMER_RESCHEDULED",
    label: "Customer rescheduled",
    description: "A customer reschedules their appointment online.",
    category: "bookings",
  },
  {
    event: "CUSTOMER_CANCELLED",
    label: "Customer cancelled",
    description: "A customer cancels their appointment online.",
    category: "bookings",
  },
  {
    event: "BOOKING_REMINDER",
    label: "Booking reminders",
    description:
      "Email reminders before confirmed appointments. Choose one or more times below.",
    category: "bookings",
  },
  {
    event: "PAYMENT_RECEIVED",
    label: "Payment received",
    description: "A customer pays an invoice through Stripe.",
    category: "payments",
  },
  {
    event: "REVIEW_DISCOUNT_CLAIMED",
    label: "Review discount claimed",
    description: "A customer claims their 10% off code after leaving a Google review.",
    category: "payments",
  },
];

export const ADMIN_NOTIFICATION_CATEGORY_LABELS: Record<
  AdminNotificationCategory,
  string
> = {
  inquiries: "Inquiries",
  quotes: "Quotes",
  bookings: "Bookings",
  payments: "Payments",
};

export async function getAdminNotificationRecipients(
  event: AdminNotificationEvent
): Promise<string[]> {
  const preferences = await db.adminNotificationPreference.findMany({
    where: { event, enabled: true },
    include: { adminUser: { select: { email: true } } },
  });

  return [...new Set(preferences.map((pref) => pref.adminUser.email))];
}

export async function seedAdminNotificationPreferences(
  adminUserId: string
): Promise<void> {
  for (const event of ADMIN_NOTIFICATION_EVENTS) {
    await db.adminNotificationPreference.upsert({
      where: {
        adminUserId_event: {
          adminUserId,
          event,
        },
      },
      create: {
        adminUserId,
        event,
        enabled: event !== "BOOKING_REMINDER",
      },
      update: {},
    });
  }
}
