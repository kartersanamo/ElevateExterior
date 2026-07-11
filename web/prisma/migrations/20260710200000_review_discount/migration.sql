-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountCode" TEXT;
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountClaimedAt" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "reviewDiscountRedeemedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reviewDiscountCode_key" ON "Booking"("reviewDiscountCode");
