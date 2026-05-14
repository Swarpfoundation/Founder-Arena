import { z } from "zod";

export const SECTORS = [
  "SaaS",
  "Fintech",
  "Healthtech",
  "AI / ML",
  "E-commerce",
  "Consumer",
  "Enterprise",
  "Climate",
  "EdTech",
  "Other",
] as const;

export const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "Latin America",
  "Africa",
  "Oceania",
  "Remote / Global",
] as const;

export const createStartupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(180, "Description must be 180 characters or less"),
  sector: z.string().min(1, "Sector is required"),
  region: z.string().min(1, "Region is required"),
  targetMarket: z
    .string()
    .min(1, "Target customer is required")
    .max(200, "Target market must be 200 characters or less"),
  problem: z
    .string()
    .min(20, "Problem must be at least 20 characters")
    .max(5000, "Problem must be 5000 characters or less"),
  solution: z
    .string()
    .min(20, "Solution must be at least 20 characters")
    .max(5000, "Solution must be 5000 characters or less"),
  monetizationModel: z
    .string()
    .min(1, "Business model is required")
    .max(500, "Business model must be 500 characters or less"),
  unfairAdvantage: z
    .string()
    .min(1, "Founder background is required")
    .max(2000, "Unfair advantage must be 2000 characters or less"),
  fundingAsk: z.coerce
    .number()
    .min(25000, "Minimum funding ask is $25,000")
    .max(10000000, "Maximum funding ask is $10,000,000"),
});

export type CreateStartupInput = z.infer<typeof createStartupSchema>;

export const pitchDeckSchema = z.object({
  problem: z
    .string()
    .min(20, "Problem must be at least 20 characters")
    .max(5000, "Problem must be 5000 characters or less"),
  solution: z
    .string()
    .min(20, "Solution must be at least 20 characters")
    .max(5000, "Solution must be 5000 characters or less"),
  marketSize: z
    .string()
    .min(20, "Market size must be at least 20 characters")
    .max(3000, "Market size must be 3000 characters or less"),
  product: z
    .string()
    .min(20, "Product description must be at least 20 characters")
    .max(5000, "Product must be 5000 characters or less"),
  businessModel: z
    .string()
    .min(20, "Business model must be at least 20 characters")
    .max(3000, "Business model must be 3000 characters or less"),
  goToMarket: z
    .string()
    .min(20, "Go-to-market must be at least 20 characters")
    .max(3000, "Go-to-market must be 3000 characters or less"),
  competition: z
    .string()
    .min(10, "Competition must be at least 10 characters")
    .max(3000, "Competition must be 3000 characters or less"),
  team: z
    .string()
    .max(2000, "Team must be 2000 characters or less")
    .optional(),
  financialPlan: z
    .string()
    .min(20, "Financial plan must be at least 20 characters")
    .max(3000, "Financial plan must be 3000 characters or less"),
  ask: z
    .string()
    .min(1, "Funding ask is required")
    .max(1000, "Ask must be 1000 characters or less"),
  useOfFunds: z
    .string()
    .min(20, "Use of funds must be at least 20 characters")
    .max(3000, "Use of funds must be 3000 characters or less"),
});

export type PitchDeckInput = z.infer<typeof pitchDeckSchema>;
