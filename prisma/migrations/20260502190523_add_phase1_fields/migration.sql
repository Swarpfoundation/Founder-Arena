/*
  Warnings:

  - You are about to drop the column `market` on the `pitch_decks` table. All the data in the column will be lost.
  - You are about to drop the column `traction` on the `pitch_decks` table. All the data in the column will be lost.
  - Added the required column `competition` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `financialPlan` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goToMarket` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketSize` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `useOfFunds` to the `pitch_decks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `startups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fundingAsk` to the `startups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problem` to the `startups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `startups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solution` to the `startups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unfairAdvantage` to the `startups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pitch_decks" DROP COLUMN "market",
DROP COLUMN "traction",
ADD COLUMN     "competition" TEXT NOT NULL,
ADD COLUMN     "financialPlan" TEXT NOT NULL,
ADD COLUMN     "goToMarket" TEXT NOT NULL,
ADD COLUMN     "marketSize" TEXT NOT NULL,
ADD COLUMN     "product" TEXT NOT NULL,
ADD COLUMN     "useOfFunds" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "startups" ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "cash" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "fundingAsk" INTEGER NOT NULL,
ADD COLUMN     "investorScore" INTEGER,
ADD COLUMN     "marketScore" INTEGER,
ADD COLUMN     "monthlyBurn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "problem" TEXT NOT NULL,
ADD COLUMN     "productProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "revenue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "solution" TEXT NOT NULL,
ADD COLUMN     "unfairAdvantage" TEXT NOT NULL,
ADD COLUMN     "valuation" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vc_reviews" ADD COLUMN     "marketTiming" TEXT,
ADD COLUMN     "milestones" TEXT,
ADD COLUMN     "proposedAmount" INTEGER,
ADD COLUMN     "proposedEquity" DECIMAL(5,2),
ADD COLUMN     "rawResponse" JSONB,
ADD COLUMN     "strengths" TEXT,
ADD COLUMN     "weaknesses" TEXT;
