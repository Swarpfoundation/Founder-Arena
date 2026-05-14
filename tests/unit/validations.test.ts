import { describe, it, expect } from "vitest";
import { createStartupSchema, pitchDeckSchema } from "@/lib/validations";

describe("createStartupSchema", () => {
  it("accepts valid startup data", () => {
    const result = createStartupSchema.safeParse({
      name: "Acme Inc",
      description: "A revolutionary logistics platform for SMBs.",
      sector: "SaaS",
      region: "North America",
      targetMarket: "SMBs in logistics",
      problem: "Small logistics companies struggle with route optimization and cost tracking due to fragmented tools.",
      solution: "An all-in-one platform that automates route planning and provides real-time cost analytics.",
      monetizationModel: "SaaS subscription",
      unfairAdvantage: "Founder spent 10 years in logistics operations.",
      fundingAsk: 500000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = createStartupSchema.safeParse({
      name: "A",
      description: "A revolutionary logistics platform for SMBs.",
      sector: "SaaS",
      region: "North America",
      targetMarket: "SMBs",
      problem: "Small logistics companies struggle with route optimization.",
      solution: "An all-in-one platform that automates route planning.",
      monetizationModel: "SaaS",
      unfairAdvantage: "Experience",
      fundingAsk: 500000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === "name")).toBe(true);
    }
  });

  it("rejects funding ask below minimum", () => {
    const result = createStartupSchema.safeParse({
      name: "Acme Inc",
      description: "A revolutionary logistics platform for SMBs.",
      sector: "SaaS",
      region: "North America",
      targetMarket: "SMBs",
      problem: "Small logistics companies struggle with route optimization.",
      solution: "An all-in-one platform that automates route planning.",
      monetizationModel: "SaaS",
      unfairAdvantage: "Experience",
      fundingAsk: 1000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === "fundingAsk")).toBe(true);
    }
  });
});

describe("pitchDeckSchema", () => {
  it("accepts valid pitch deck", () => {
    const result = pitchDeckSchema.safeParse({
      problem: "Small logistics companies struggle with route optimization and cost tracking due to fragmented tools.",
      solution: "An all-in-one platform that automates route planning and provides real-time cost analytics.",
      marketSize: "$50B TAM, $5B SAM, $500M SOM",
      product: "Web dashboard + mobile app for drivers",
      businessModel: "SaaS subscription starting at $99/month per fleet",
      goToMarket: "Direct sales to mid-size logistics companies",
      competition: "Route4Me, OptimoRoute",
      team: "2 founders, 3 engineers",
      financialPlan: "Break-even by month 18",
      ask: "$500,000 seed",
      useOfFunds: "50% engineering, 30% sales, 20% operations",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short problem description", () => {
    const result = pitchDeckSchema.safeParse({
      problem: "Too short",
      solution: "An all-in-one platform that automates route planning and provides real-time cost analytics.",
      marketSize: "$50B TAM",
      product: "Web dashboard",
      businessModel: "SaaS",
      goToMarket: "Direct sales",
      competition: "None",
      financialPlan: "Break-even soon",
      ask: "$500k",
      useOfFunds: "Engineering",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path[0] === "problem")).toBe(true);
    }
  });
});
