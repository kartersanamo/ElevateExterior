-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'website';
ALTER TABLE "QuoteRequest" ADD COLUMN "externalLeadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_externalLeadId_key" ON "QuoteRequest"("externalLeadId");
CREATE INDEX "QuoteRequest_source_idx" ON "QuoteRequest"("source");
