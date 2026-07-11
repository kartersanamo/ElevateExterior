-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountCode" TEXT;
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountClaimedAt" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountRedeemedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reviewDiscountCode_key" ON "Booking"("reviewDiscountCode");

-- Seed REVIEW_DISCOUNT_CLAIMED preference for existing admin users
INSERT INTO "AdminNotificationPreference" ("id", "adminUserId", "event", "enabled")
SELECT
  'pref_' || au."id" || '_REVIEW_DISCOUNT_CLAIMED',
  au."id",
  'REVIEW_DISCOUNT_CLAIMED',
  1
FROM "AdminUser" au
WHERE NOT EXISTS (
  SELECT 1 FROM "AdminNotificationPreference" p
  WHERE p."adminUserId" = au."id" AND p."event" = 'REVIEW_DISCOUNT_CLAIMED'
);
