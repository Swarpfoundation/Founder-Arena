-- Add private structured profile data for mobile startup sync.
ALTER TABLE "startups" ADD COLUMN "profile" JSONB;
