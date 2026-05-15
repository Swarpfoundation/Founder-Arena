-- AlterTable
ALTER TABLE "social_state" ADD COLUMN     "rivalMoveHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "rivalProfiles" JSONB NOT NULL DEFAULT '[]';
