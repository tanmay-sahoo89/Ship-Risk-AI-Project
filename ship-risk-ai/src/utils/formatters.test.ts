import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatPercentage,
  formatDate,
  formatHours,
} from "../utils/formatters";

describe("Formatters", () => {
  describe("formatNumber", () => {
    it("formats large numbers with commas", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("handles small numbers", () => {
      expect(formatNumber(100)).toBe("100");
      expect(formatNumber(5)).toBe("5");
    });

    it("handles zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("handles decimal numbers", () => {
      expect(formatNumber(1234.56)).toBe("1,234.56");
    });
  });

  describe("formatPercentage", () => {
    it("formats decimals as percentages", () => {
      expect(formatPercentage(0.75)).toBe("75.0%");
      expect(formatPercentage(0.5)).toBe("50.0%");
      expect(formatPercentage(0.1)).toBe("10.0%");
    });

    it("handles zero and one", () => {
      expect(formatPercentage(0)).toBe("0.0%");
      expect(formatPercentage(1)).toBe("100.0%");
    });

    it("respects default precision", () => {
      expect(formatPercentage(0.7525)).toMatch(/75/);
    });
  });

  describe("formatDate", () => {
    it("formats date strings correctly", () => {
      const date = new Date("2024-01-15").toISOString();
      const formatted = formatDate(date);
      expect(formatted).toContain("1");
      expect(formatted).toContain("2024");
    });
  });

  describe("formatHours", () => {
    it("formats hours correctly", () => {
      expect(formatHours(24)).toContain("24");
      expect(formatHours(48)).toContain("48");
    });
  });
});
