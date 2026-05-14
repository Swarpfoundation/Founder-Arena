-- Add team management fields to Startup
ALTER TABLE "startups"
ADD COLUMN "workSetup" TEXT NOT NULL DEFAULT 'remote',
ADD COLUMN "officeMonthlyCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "teamMorale" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN "teamProductivity" DECIMAL(3,2) NOT NULL DEFAULT 1.0;

-- Add team management fields to Employee
ALTER TABLE "employees"
ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Unnamed Employee',
ADD COLUMN "seniority" TEXT NOT NULL DEFAULT 'mid',
ADD COLUMN "skill" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN "morale" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "firedAt" TIMESTAMP(3),
ADD COLUMN "effectJson" JSONB,
ADD COLUMN "notes" TEXT;
