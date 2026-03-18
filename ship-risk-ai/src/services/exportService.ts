/**
 * Export Service
 * Handles exporting data to PDF and CSV formats
 */

import type { ShipmentAlert } from "../types/alert";
import type { Shipment } from "../types/shipment";
import type { Recommendation } from "../types/risk";

// CSV Export
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate Shipment Report as PDF (HTML-based, prints via browser)
export const generateShipmentReportPDF = (
  shipment: Shipment,
  alerts: ShipmentAlert[],
  recommendations: Recommendation[],
): void => {
  const riskTier =
    shipment.delay_probability >= 0.9
      ? "CRITICAL"
      : shipment.delay_probability >= 0.6
        ? "HIGH"
        : shipment.delay_probability >= 0.3
          ? "MEDIUM"
          : "LOW";

  const riskColor =
    riskTier === "CRITICAL"
      ? "#DC2626"
      : riskTier === "HIGH"
        ? "#F97316"
        : riskTier === "MEDIUM"
          ? "#F59E0B"
          : "#10B981";

  const riskFactors = [
    `Weather: ${shipment.weather_condition} (severity: ${shipment.weather_severity_score}/10)`,
    `Traffic congestion: Level ${shipment.traffic_congestion_level}/10`,
    `Port congestion: ${shipment.port_congestion_score}/10`,
    `Carrier reliability: ${(shipment.carrier_reliability_score * 100).toFixed(0)}%`,
    `Historical delay rate: ${(shipment.historical_delay_rate * 100).toFixed(1)}%`,
    `Route risk score: ${(shipment.route_risk_score * 100).toFixed(0)}%`,
  ];

  const content = `
    <html>
      <head>
        <title>Shipment Report - ${shipment.shipment_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
          h1 { color: #2A0800; border-bottom: 3px solid #2A0800; padding-bottom: 10px; }
          h2 { color: #775144; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          .header-meta { color: #666; font-size: 12px; margin-bottom: 20px; }
          .risk-badge {
            display: inline-block;
            background: ${riskColor};
            color: white;
            padding: 6px 16px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
          }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
          .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
          .info-box h3 { margin: 0 0 8px 0; color: #775144; font-size: 14px; }
          .info-box p { margin: 4px 0; font-size: 13px; }
          .label { color: #666; }
          .value { color: #333; font-weight: 600; }
          .risk-factors { list-style: none; padding: 0; }
          .risk-factors li { padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px; }
          .risk-factors li:before { content: "\\26A0"; margin-right: 8px; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
          th { background-color: #2A0800; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .progress-bar { background: #eee; border-radius: 10px; height: 12px; margin: 8px 0; }
          .progress-fill { background: ${riskColor}; height: 100%; border-radius: 10px; }
          .footer { margin-top: 40px; color: #666; font-size: 11px; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { margin: 15px; } }
        </style>
      </head>
      <body>
        <h1>SHIPMENT RISK REPORT</h1>
        <p class="header-meta">Generated: ${new Date().toLocaleString()} | Ship Risk AI Platform</p>

        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 24px; font-weight: bold;">${shipment.shipment_id}</div>
            <div style="font-size: 14px; color: #666;">${shipment.origin} → ${shipment.destination}</div>
          </div>
          <span class="risk-badge">${riskTier} - ${(shipment.delay_probability * 100).toFixed(1)}% Delay Risk</span>
        </div>

        <h2>Shipment Overview</h2>
        <div class="grid">
          <div class="info-box">
            <h3>Route Information</h3>
            <p><span class="label">Origin:</span> <span class="value">${shipment.origin}</span></p>
            <p><span class="label">Destination:</span> <span class="value">${shipment.destination}</span></p>
            <p><span class="label">Transport Mode:</span> <span class="value">${shipment.transport_mode}</span></p>
            <p><span class="label">Stops:</span> <span class="value">${shipment.num_stops}</span></p>
          </div>
          <div class="info-box">
            <h3>Carrier & Timeline</h3>
            <p><span class="label">Carrier:</span> <span class="value">${shipment.carrier}</span></p>
            <p><span class="label">Ship Date:</span> <span class="value">${shipment.shipment_date}</span></p>
            <p><span class="label">ETA:</span> <span class="value">${shipment.planned_eta}</span></p>
            <p><span class="label">Transit:</span> <span class="value">${shipment.days_in_transit}/${shipment.planned_transit_days} days</span></p>
          </div>
        </div>

        <h2>Transit Progress</h2>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min((shipment.days_in_transit / shipment.planned_transit_days) * 100, 100)}%"></div>
        </div>
        <p style="font-size: 13px; color: #666;">
          ${((shipment.days_in_transit / shipment.planned_transit_days) * 100).toFixed(0)}% complete
          ${shipment.is_delayed ? ` | <strong style="color: #DC2626;">DELAYED by ${shipment.actual_delay_hours.toFixed(1)} hours</strong>` : " | On Track"}
        </p>

        <h2>Risk Assessment</h2>
        <div class="grid">
          <div class="info-box">
            <h3>Weather Conditions</h3>
            <p><span class="label">Condition:</span> <span class="value">${shipment.weather_condition}</span></p>
            <p><span class="label">Severity:</span> <span class="value">${shipment.weather_severity_score}/10</span></p>
          </div>
          <div class="info-box">
            <h3>Disruptions</h3>
            <p><span class="label">Type:</span> <span class="value">${shipment.disruption_type}</span></p>
            <p><span class="label">Impact:</span> <span class="value">${shipment.disruption_impact_score}/10</span></p>
          </div>
        </div>

        <h3>Risk Factors</h3>
        <ul class="risk-factors">
          ${riskFactors.map((f) => `<li>${f}</li>`).join("")}
        </ul>

        ${
          alerts.length > 0
            ? `
        <h2>Active Alerts (${alerts.length})</h2>
        <table>
          <thead>
            <tr><th>Risk Tier</th><th>Delay Probability</th><th>Hours to SLA</th><th>Action Required</th></tr>
          </thead>
          <tbody>
            ${alerts
              .map(
                (a) => `
              <tr>
                <td style="color: ${a.risk_tier === "CRITICAL" ? "#DC2626" : a.risk_tier === "HIGH" ? "#F97316" : "#F59E0B"}; font-weight: bold;">${a.risk_tier}</td>
                <td>${(a.delay_probability * 100).toFixed(1)}%</td>
                <td>${a.hours_to_sla}h</td>
                <td>${a.action_required}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
            : ""
        }

        ${
          recommendations.length > 0
            ? `
        <h2>Recommended Actions (${recommendations.length})</h2>
        <table>
          <thead>
            <tr><th>Action</th><th>Cost Impact</th><th>Time Saving</th><th>SLA Impact</th><th>Confidence</th></tr>
          </thead>
          <tbody>
            ${recommendations
              .map(
                (r) => `
              <tr>
                <td><strong>${r.primary_action}</strong><br><small>${r.primary_description}</small></td>
                <td>${r.cost_impact}</td>
                <td>${r.estimated_time_saving}</td>
                <td>${r.sla_impact}</td>
                <td>${r.confidence}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
            : ""
        }

        <div class="footer">
          <p>Ship Risk AI - Intelligent Shipment Risk Management Platform</p>
          <p>This report is confidential and for authorized use only.</p>
        </div>
      </body>
    </html>
  `;

  // Open in new window for printing as PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    // Delay print to allow rendering
    setTimeout(() => printWindow.print(), 500);
  }
};

// Simple PDF Export using HTML to PDF
export const exportAlertsToPDF = (alerts: ShipmentAlert[]): void => {
  const content = `
    <html>
      <head>
        <title>Shipment Alerts Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2A0800; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #2A0800; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .critical { color: #DC2626; font-weight: bold; }
          .high { color: #F97316; font-weight: bold; }
          .medium { color: #F59E0B; font-weight: bold; }
          .low { color: #10B981; font-weight: bold; }
          .footer { margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Shipment Alerts Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Alerts: ${alerts.length}</p>

        <table>
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Risk Tier</th>
              <th>Delay Probability</th>
              <th>Hours to SLA</th>
            </tr>
          </thead>
          <tbody>
            ${alerts
              .map(
                (alert) => `
              <tr>
                <td>${alert.shipment_id}</td>
                <td class="${alert.risk_tier.toLowerCase()}">${alert.risk_tier}</td>
                <td>${(alert.delay_probability * 100).toFixed(1)}%</td>
                <td>${alert.hours_to_sla}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Ship Risk AI - Intelligent Shipment Risk Management</p>
          <p>This report is confidential and for authorized use only.</p>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
};

// Export Utils
export const exportService = {
  exportAlertsAsCSV: (alerts: ShipmentAlert[]) => {
    const data = alerts.map((alert) => ({
      ShipmentID: alert.shipment_id,
      RiskTier: alert.risk_tier,
      DelayProbability: `${(alert.delay_probability * 100).toFixed(1)}%`,
      HoursToSLA: alert.hours_to_sla,
    }));
    exportToCSV(data, "shipment-alerts");
  },

  exportShipmentsAsCSV: (shipments: Shipment[]) => {
    const data = shipments.map((shipment) => ({
      ShipmentID: shipment.shipment_id,
      Origin: shipment.origin,
      Destination: shipment.destination,
      Carrier: shipment.carrier,
      Status: shipment.shipment_status,
      DelayProbability: `${(shipment.delay_probability * 100).toFixed(1)}%`,
      ETA: new Date(shipment.planned_eta).toLocaleString(),
    }));
    exportToCSV(data, "shipments-export");
  },

  exportAlertsToPDF,
};
