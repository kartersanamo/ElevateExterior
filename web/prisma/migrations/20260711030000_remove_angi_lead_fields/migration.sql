-- Drop Angi webhook columns from QuoteRequest
DROP INDEX IF EXISTS "QuoteRequest_source_idx";
DROP INDEX IF EXISTS "QuoteRequest_externalLeadId_key";
ALTER TABLE "QuoteRequest" DROP COLUMN "source";
ALTER TABLE "QuoteRequest" DROP COLUMN "externalLeadId";
