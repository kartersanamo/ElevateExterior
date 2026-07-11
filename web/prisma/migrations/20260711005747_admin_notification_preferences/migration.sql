-- CreateTable
CREATE TABLE "AdminNotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AdminNotificationPreference_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationPreference_adminUserId_event_key" ON "AdminNotificationPreference"("adminUserId", "event");

-- Seed default preferences for existing admin users (all events enabled)
INSERT INTO "AdminNotificationPreference" ("id", "adminUserId", "event", "enabled")
SELECT
  'pref_' || au."id" || '_' || e."event",
  au."id",
  e."event",
  1
FROM "AdminUser" au
CROSS JOIN (
  SELECT 'CONTACT_FORM_SUBMITTED' AS "event" UNION ALL
  SELECT 'QUOTE_REQUEST_SUBMITTED' UNION ALL
  SELECT 'QUOTE_ACCEPTED' UNION ALL
  SELECT 'BOOKING_REQUEST_SUBMITTED' UNION ALL
  SELECT 'CUSTOMER_RESCHEDULED' UNION ALL
  SELECT 'CUSTOMER_CANCELLED' UNION ALL
  SELECT 'PAYMENT_RECEIVED'
) e;
