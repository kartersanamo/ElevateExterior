-- CreateTable
CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobPhoto_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "address" TEXT,
    "services" TEXT NOT NULL DEFAULT '[]',
    "message" TEXT NOT NULL,
    "quotedAmountCents" INTEGER,
    "quoteNotes" TEXT,
    "proposedDate" DATETIME,
    "proposedStartTime" TEXT,
    "proposedEndTime" TEXT,
    "bookingId" TEXT,
    "quotedAt" DATETIME,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "address" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sourceBookingId" TEXT,
    "nextServiceDate" DATETIME,
    "lastServiceDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringService_sourceBookingId_fkey" FOREIGN KEY ("sourceBookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "notes" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "publicToken" TEXT,
    "amountChargedCents" INTEGER,
    "completedAt" DATETIME,
    "paidAt" DATETIME,
    "stripeCheckoutSessionId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceHtml" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Booking" ("id", "status", "customerName", "customerEmail", "customerPhone", "address", "services", "notes", "scheduledDate", "startTime", "endTime", "createdAt", "updatedAt") SELECT "id", "status", "customerName", "customerEmail", "customerPhone", "address", "services", "notes", "scheduledDate", "startTime", "endTime", "createdAt", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_scheduledDate_status_idx" ON "Booking"("scheduledDate", "status");
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");
CREATE UNIQUE INDEX "Booking_publicToken_key" ON "Booking"("publicToken");
CREATE INDEX "Booking_publicToken_idx" ON "Booking"("publicToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JobPhoto_bookingId_idx" ON "JobPhoto"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_publicToken_key" ON "QuoteRequest"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_bookingId_key" ON "QuoteRequest"("bookingId");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "QuoteRequest_customerEmail_idx" ON "QuoteRequest"("customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringService_sourceBookingId_key" ON "RecurringService"("sourceBookingId");

-- CreateIndex
CREATE INDEX "RecurringService_customerEmail_idx" ON "RecurringService"("customerEmail");

-- CreateIndex
CREATE INDEX "RecurringService_active_nextServiceDate_idx" ON "RecurringService"("active", "nextServiceDate");
