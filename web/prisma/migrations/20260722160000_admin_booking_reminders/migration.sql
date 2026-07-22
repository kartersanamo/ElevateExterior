-- AlterEnum: SQLite stores enums as TEXT; seed new event for existing admins
INSERT INTO "AdminNotificationPreference" ("id", "adminUserId", "event", "enabled")
SELECT
  'pref_' || au."id" || '_BOOKING_REMINDER',
  au."id",
  'BOOKING_REMINDER',
  0
FROM "AdminUser" au
WHERE NOT EXISTS (
  SELECT 1 FROM "AdminNotificationPreference" p
  WHERE p."adminUserId" = au."id" AND p."event" = 'BOOKING_REMINDER'
);

-- CreateTable
CREATE TABLE "AdminBookingReminderOffset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "minutesBefore" INTEGER,
    "dayOf" BOOLEAN NOT NULL DEFAULT false,
    "dayOfAtTime" TEXT NOT NULL DEFAULT '07:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminBookingReminderOffset_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminBookingReminderSendLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "offsetId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminBookingReminderSendLog_offsetId_fkey" FOREIGN KEY ("offsetId") REFERENCES "AdminBookingReminderOffset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminBookingReminderSendLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdminBookingReminderOffset_adminUserId_idx" ON "AdminBookingReminderOffset"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminBookingReminderSendLog_bookingId_offsetId_key" ON "AdminBookingReminderSendLog"("bookingId", "offsetId");

-- CreateIndex
CREATE INDEX "AdminBookingReminderSendLog_sentAt_idx" ON "AdminBookingReminderSendLog"("sentAt");
