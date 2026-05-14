-- AlterTable
ALTER TABLE "founder_profiles" ADD COLUMN "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_publicSlug_key" ON "founder_profiles"("publicSlug");
