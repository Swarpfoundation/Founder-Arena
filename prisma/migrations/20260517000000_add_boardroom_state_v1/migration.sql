-- AddColumn boardroom_state to social_state
ALTER TABLE "social_state" ADD COLUMN "boardroom_state" JSONB NOT NULL DEFAULT '{}';
