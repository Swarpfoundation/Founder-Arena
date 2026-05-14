import { describe, it, expect } from "vitest";
import { getSectorIcon, getSectorIconKeys } from "@/lib/assets/sector-icon-map";
import { getOutcomeIcon } from "@/lib/assets/outcome-icon-map";
import { getAchievementIcon, getAchievementIconKeys } from "@/lib/assets/achievement-icon-map";
import { getEventCategoryIcon, getSeverityIcon } from "@/lib/assets/event-icon-map";
import { getActorIcon } from "@/lib/assets/actor-icon-map";

describe("Asset Registry", () => {
  describe("Sector Icon Map", () => {
    it("maps all canonical sectors", () => {
      const sectors = ["AI / ML", "Fintech", "Web3", "SaaS", "Healthtech", "Gaming", "Logistics", "Energy", "Marketplace", "Consumer", "Enterprise", "Climate", "EdTech", "Hardware", "Defense"];
      for (const sector of sectors) {
        const Icon = getSectorIcon(sector);
        expect(Icon).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });

    it("returns fallback for unknown sectors", () => {
      const Icon = getSectorIcon("UnknownSector");
      expect(Icon).toBeDefined();
    });

    it("is case-insensitive", () => {
      expect(getSectorIcon("fintech")).toBe(getSectorIcon("FINTECH"));
    });

    it("exports key list", () => {
      expect(getSectorIconKeys().length).toBeGreaterThan(10);
    });
  });

  describe("Outcome Icon Map", () => {
    it("maps all engine outcomes", () => {
      const outcomes = ["DEAD", "ZOMBIE", "BREAKOUT", "SERIES_A_READY", "SEED_READY", "SMALL_PROFITABLE", "ACQUISITION_TARGET", "ACQUIRED", "EXITED"];
      for (const outcome of outcomes) {
        const Icon = getOutcomeIcon(outcome);
        expect(Icon).toBeDefined();
      }
    });

    it("returns fallback for null/undefined", () => {
      expect(getOutcomeIcon(null)).toBeDefined();
      expect(getOutcomeIcon(undefined)).toBeDefined();
    });

    it("returns fallback for unknown outcomes", () => {
      expect(getOutcomeIcon("UNKNOWN")).toBeDefined();
    });
  });

  describe("Achievement Icon Map", () => {
    it("maps all defined achievements", () => {
      const keys = getAchievementIconKeys();
      expect(keys.length).toBeGreaterThanOrEqual(20);
      for (const key of keys) {
        const Icon = getAchievementIcon(key);
        expect(Icon).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });

    it("returns fallback for unknown keys", () => {
      expect(getAchievementIcon("nonexistent")).toBeDefined();
    });
  });

  describe("Event Icon Map", () => {
    it("maps all event categories", () => {
      const categories = ["market", "team", "product", "security", "regulatory", "investor", "customer", "competitor", "finance", "viral", "operational"];
      for (const cat of categories) {
        const Icon = getEventCategoryIcon(cat);
        expect(Icon).toBeDefined();
      }
    });

    it("maps all severity levels", () => {
      expect(getSeverityIcon("minor")).toBeDefined();
      expect(getSeverityIcon("moderate")).toBeDefined();
      expect(getSeverityIcon("critical")).toBeDefined();
    });

    it("returns fallback for unknown values", () => {
      expect(getEventCategoryIcon("unknown")).toBeDefined();
      expect(getSeverityIcon("unknown")).toBeDefined();
    });
  });

  describe("Actor Icon Map", () => {
    it("maps all 15 strategic actors", () => {
      const actorIds = [
        "frontier_ai_lab",
        "cloud_hyperscaler",
        "mobile_platform",
        "enterprise_giant",
        "payments_network",
        "ecommerce_platform",
        "chip_infrastructure",
        "healthcare_platform",
        "logistics_operator",
        "social_platform",
        "crypto_exchange",
        "cybersecurity_platform",
        "banking_infrastructure",
        "gaming_publisher",
        "energy_infrastructure",
      ];
      for (const id of actorIds) {
        const Icon = getActorIcon(id);
        expect(Icon).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });

    it("returns fallback for unknown actors", () => {
      expect(getActorIcon("unknown")).toBeDefined();
    });
  });
});
