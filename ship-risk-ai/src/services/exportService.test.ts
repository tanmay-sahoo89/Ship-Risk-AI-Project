import { describe, it, expect, vi, afterEach } from "vitest";
import { exportService } from "../services/exportService";
import type { ShipmentAlert } from "../types/alert";

describe("Export Service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("exportAlertsAsCSV", () => {
    it("should handle empty alerts array", () => {
      const logWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const mockAlerts: ShipmentAlert[] = [];

      exportService.exportAlertsAsCSV(mockAlerts);

      expect(logWarnSpy).toHaveBeenCalledWith("No data to export");
      logWarnSpy.mockRestore();
    });

    it("should process alerts correctly", () => {
      const mockAlerts: ShipmentAlert[] = [
        {
          shipment_id: "SHIP-001",
          risk_tier: "HIGH",
          delay_probability: 0.75,
          hours_to_sla: 24,
          eta: new Date().toISOString(),
          origin: "New York",
          destination: "Los Angeles",
          carrier: "FedEx",
          transport_mode: "Air",
          top_risk_factors: ["Weather", "Traffic"],
          action_required: "Reroute",
          alert_generated_at: new Date().toISOString(),
          alert_type: "48H_WARNING",
        },
      ];

      // Mock the document methods
      const createElementSpy = vi.spyOn(document, "createElement");

      exportService.exportAlertsAsCSV(mockAlerts);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      createElementSpy.mockRestore();
    });
  });

  describe("exportAlertsToPDF", () => {
    it("should create HTML content for PDF", () => {
      const mockAlerts: ShipmentAlert[] = [
        {
          shipment_id: "SHIP-001",
          risk_tier: "CRITICAL",
          delay_probability: 0.95,
          hours_to_sla: 12,
          eta: new Date().toISOString(),
          origin: "Shanghai",
          destination: "Rotterdam",
          carrier: "Maersk",
          transport_mode: "Sea",
          top_risk_factors: ["Severe Weather"],
          action_required: "Mode Switch",
          alert_generated_at: new Date().toISOString(),
          alert_type: "IMMEDIATE",
        },
      ];

      const createElementSpy = vi.spyOn(document, "createElement");

      exportService.exportAlertsToPDF(mockAlerts);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      createElementSpy.mockRestore();
    });
  });
});
