-- QuoteStatus EXPIRED is stored as text in SQLite; no enum alteration needed.

-- Booking: review request tracking
ALTER TABLE "Booking" ADD COLUMN "reviewRequestSentAt" DATETIME;

-- QuoteRequest: slot hold expiry
ALTER TABLE "QuoteRequest" ADD COLUMN "holdExpiresAt" DATETIME;
CREATE INDEX "QuoteRequest_holdExpiresAt_idx" ON "QuoteRequest"("holdExpiresAt");

-- RecurringService: preferred times for auto-booking
ALTER TABLE "RecurringService" ADD COLUMN "preferredStartTime" TEXT;
ALTER TABLE "RecurringService" ADD COLUMN "preferredEndTime" TEXT;

-- GalleryImage: local upload storage key
ALTER TABLE "GalleryImage" ADD COLUMN "storageKey" TEXT;

-- SiteSettings: Google review URL
ALTER TABLE "SiteSettings" ADD COLUMN "googleReviewUrl" TEXT;

-- Backfill publicToken for existing active/completed bookings
UPDATE "Booking"
SET "publicToken" = lower(hex(randomblob(16)))
WHERE "publicToken" IS NULL
  AND "status" IN ('CONFIRMED', 'COMPLETED', 'PENDING');
