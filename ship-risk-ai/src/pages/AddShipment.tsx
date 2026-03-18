import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { useShipmentContext } from "../contexts/ShipmentContext";
import { apiService } from "../services/api";
import {
  parseCSV,
  validateCSVBatch,
  downloadSampleCSV,
} from "../utils/csvHelpers";
import type { ShipmentCSVRow } from "../utils/csvHelpers";

const CARRIERS = [
  "FedEx",
  "DHL",
  "UPS",
  "Maersk",
  "DB Schenker",
  "XPO Logistics",
];
const ORIGINS = [
  "Shanghai",
  "Hamburg",
  "Los Angeles",
  "Mumbai",
  "Rotterdam",
  "Dubai",
];
const DESTINATIONS = [
  "New York",
  "London",
  "Tokyo",
  "Sydney",
  "Chicago",
  "Singapore",
];
const TRANSPORT_MODES = ["Air", "Sea", "Road", "Rail"];
const WEATHER_CONDITIONS = [
  "Clear",
  "Rain",
  "Heavy Rain",
  "Storm",
  "Fog",
  "Snow",
  "Blizzard",
];
const DISRUPTION_TYPES = [
  "None",
  "Port Strike",
  "Traffic Jam",
  "Natural Disaster",
  "Equipment Failure",
];

interface FormField {
  label: string;
  name: string;
  type: "text" | "number" | "select" | "date";
  options?: string[];
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
}

const formFields: FormField[] = [
  { label: "Shipment ID", name: "shipment_id", type: "text", required: true },
  {
    label: "Origin",
    name: "origin",
    type: "select",
    options: ORIGINS,
    required: true,
  },
  {
    label: "Destination",
    name: "destination",
    type: "select",
    options: DESTINATIONS,
    required: true,
  },
  {
    label: "Carrier",
    name: "carrier",
    type: "select",
    options: CARRIERS,
    required: true,
  },
  {
    label: "Transport Mode",
    name: "transport_mode",
    type: "select",
    options: TRANSPORT_MODES,
    required: true,
  },
  {
    label: "Shipment Date",
    name: "shipment_date",
    type: "date",
    required: true,
  },
  { label: "Planned ETA", name: "planned_eta", type: "date", required: true },
  {
    label: "Planned Transit Days",
    name: "planned_transit_days",
    type: "number",
    min: "1",
    max: "60",
  },
  {
    label: "Days In Transit",
    name: "days_in_transit",
    type: "number",
    min: "0",
    max: "60",
  },
  {
    label: "Package Weight (kg)",
    name: "package_weight_kg",
    type: "number",
    step: "0.1",
    min: "0",
  },
  {
    label: "Number of Stops",
    name: "num_stops",
    type: "number",
    min: "1",
    max: "10",
  },
  {
    label: "Weather Condition",
    name: "weather_condition",
    type: "select",
    options: WEATHER_CONDITIONS,
  },
  {
    label: "Weather Severity (0-10)",
    name: "weather_severity_score",
    type: "number",
    step: "0.1",
    min: "0",
    max: "10",
  },
  {
    label: "Traffic Congestion (1-10)",
    name: "traffic_congestion_level",
    type: "number",
    min: "1",
    max: "10",
  },
  {
    label: "Port Congestion (1-10)",
    name: "port_congestion_score",
    type: "number",
    min: "1",
    max: "10",
  },
  {
    label: "Disruption Type",
    name: "disruption_type",
    type: "select",
    options: DISRUPTION_TYPES,
  },
  {
    label: "Disruption Impact (0-10)",
    name: "disruption_impact_score",
    type: "number",
    step: "0.1",
    min: "0",
    max: "10",
  },
  {
    label: "Carrier Reliability (0-1)",
    name: "carrier_reliability_score",
    type: "number",
    step: "0.01",
    min: "0",
    max: "1",
  },
  {
    label: "Historical Delay Rate (0-1)",
    name: "historical_delay_rate",
    type: "number",
    step: "0.01",
    min: "0",
    max: "1",
  },
  {
    label: "Route Risk Score (0-1)",
    name: "route_risk_score",
    type: "number",
    step: "0.01",
    min: "0",
    max: "1",
  },
];

const defaultValues: Record<string, string> = {
  shipment_id: "",
  origin: "Shanghai",
  destination: "New York",
  carrier: "FedEx",
  transport_mode: "Sea",
  shipment_date: new Date().toISOString().split("T")[0],
  planned_eta: "",
  planned_transit_days: "14",
  days_in_transit: "0",
  package_weight_kg: "500",
  num_stops: "2",
  weather_condition: "Clear",
  weather_severity_score: "0",
  traffic_congestion_level: "3",
  port_congestion_score: "3",
  disruption_type: "None",
  disruption_impact_score: "0",
  carrier_reliability_score: "0.90",
  historical_delay_rate: "0.10",
  route_risk_score: "0.20",
};

export const AddShipment: React.FC = () => {
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [form, setForm] = useState<Record<string, string>>(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { refreshData } = useShipmentContext();

  // CSV state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(0);
  const [csvPreview, setCsvPreview] = useState<ShipmentCSVRow[] | null>(null);
  const [csvAllRows, setCsvAllRows] = useState<ShipmentCSVRow[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.shipment_id.trim()) {
      addNotification("error", "Shipment ID is required");
      return;
    }
    if (!form.planned_eta) {
      addNotification("error", "Planned ETA is required");
      return;
    }

    setSubmitting(true);
    try {
      const record: Record<string, unknown> = { ...form };
      for (const field of formFields) {
        if (field.type === "number" && record[field.name] !== undefined) {
          record[field.name] = parseFloat(record[field.name] as string) || 0;
        }
      }
      record.customs_clearance_flag = 0;
      record.delay_probability = 0;
      record.is_delayed = 0;
      record.actual_delay_hours = 0;
      record.shipment_status = "In Transit";

      const result = await apiService.addShipment(record);
      addNotification("success", result.message);
      await refreshData();
      navigate("/shipments");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      addNotification("error", `Failed to add shipment: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setImportWarnings([]);
    setImportSuccess(0);
    setImportProgress(0);
    setCsvPreview(null);
    setCsvAllRows([]);

    try {
      const rows = await parseCSV(file);
      const validation = validateCSVBatch(rows);

      setImportWarnings(validation.warnings);

      if (!validation.valid) {
        setImportErrors(validation.errors);
        addNotification(
          "error",
          `CSV validation failed: ${validation.errors.length} error(s) found`,
        );
        e.target.value = "";
        return;
      }

      // Show preview of first 5 rows
      setCsvPreview(validation.parsedData.slice(0, 5));
      setCsvAllRows(validation.parsedData);
      addNotification(
        "info",
        `${validation.parsedData.length} valid row(s) ready to import`,
      );
    } catch (error) {
      setImportErrors([
        error instanceof Error ? error.message : "Unknown error",
      ]);
      addNotification("error", "Failed to parse CSV file");
    }

    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (csvAllRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvAllRows.length; i++) {
      try {
        const record: Record<string, unknown> = { ...csvAllRows[i] };
        record.customs_clearance_flag = 0;
        record.delay_probability = 0;
        record.is_delayed = 0;
        record.actual_delay_hours = 0;
        record.shipment_status = "In Transit";

        await apiService.addShipment(record);
        successCount++;
      } catch (error) {
        errors.push(
          `${csvAllRows[i].shipment_id}: ${error instanceof Error ? error.message : "Failed"}`,
        );
      }

      setImportProgress(((i + 1) / csvAllRows.length) * 100);
    }

    setImportSuccess(successCount);
    if (errors.length > 0) setImportErrors(errors);
    setCsvPreview(null);
    setCsvAllRows([]);
    setIsImporting(false);

    if (successCount > 0) {
      addNotification(
        "success",
        `Successfully imported ${successCount} shipment(s)!`,
      );
      await refreshData();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Add New Shipment</h2>
        <p className="text-light">
          Enter shipment details manually or import via CSV
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-3">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            mode === "manual"
              ? "btn-primary"
              : "glass-light text-light hover:text-accent"
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Add Manually
        </button>
        <button
          onClick={() => setMode("csv")}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            mode === "csv"
              ? "btn-primary"
              : "glass-light text-light hover:text-accent"
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Bulk CSV Import
        </button>
      </div>

      {/* Manual Form Mode */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formFields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label className="block text-sm font-medium text-light">
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                    className="input-field"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center space-x-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>{submitting ? "Adding..." : "Add Shipment"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/shipments")}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>Cancel</span>
            </button>
          </div>
        </form>
      )}

      {/* CSV Upload Mode */}
      {mode === "csv" && (
        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Bulk Import Shipments
            </h3>
            <button
              onClick={downloadSampleCSV}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV
            </button>
          </div>

          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={isImporting}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-block w-full"
            >
              {isImporting ? (
                <div>
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-3"></div>
                  <p className="text-white text-lg font-semibold">
                    Importing... {Math.round(importProgress)}%
                  </p>
                  <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 mt-4">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-light hover:text-white transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="text-lg font-semibold">
                    Click to upload CSV file
                  </p>
                  <p className="text-sm text-light mt-1">
                    Only .csv files supported
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* CSV Preview */}
          {csvPreview && csvPreview.length > 0 && (
            <div className="glass-light border border-accent/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">
                  Preview ({csvAllRows.length} rows ready to import)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCsvPreview(null);
                      setCsvAllRows([]);
                    }}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    Confirm Import
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-2 text-accent">ID</th>
                      <th className="text-left py-2 px-2 text-accent">
                        Origin
                      </th>
                      <th className="text-left py-2 px-2 text-accent">
                        Destination
                      </th>
                      <th className="text-left py-2 px-2 text-accent">
                        Carrier
                      </th>
                      <th className="text-left py-2 px-2 text-accent">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-2 px-2 text-white">
                          {row.shipment_id}
                        </td>
                        <td className="py-2 px-2 text-light">{row.origin}</td>
                        <td className="py-2 px-2 text-light">
                          {row.destination}
                        </td>
                        <td className="py-2 px-2 text-light">{row.carrier}</td>
                        <td className="py-2 px-2 text-light">
                          {row.transport_mode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvAllRows.length > 5 && (
                <p className="text-xs text-light text-center">
                  ...and {csvAllRows.length - 5} more rows
                </p>
              )}
            </div>
          )}

          {importSuccess > 0 && (
            <div className="glass-light border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold">
                Successfully imported {importSuccess} shipment
                {importSuccess !== 1 ? "s" : ""}!
              </p>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="glass-light border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-semibold mb-2">
                Validation Errors:
              </p>
              <ul className="text-red-300 text-sm space-y-1 max-h-48 overflow-y-auto">
                {importErrors.map((error, idx) => (
                  <li key={idx} className="flex gap-1">
                    <span className="shrink-0">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {importWarnings.length > 0 && (
            <div className="glass-light border border-orange-500/30 rounded-lg p-4">
              <p className="text-orange-400 font-semibold mb-2">Warnings:</p>
              <ul className="text-orange-300 text-sm space-y-1 max-h-32 overflow-y-auto">
                {importWarnings.map((warning, idx) => (
                  <li key={idx} className="flex gap-1">
                    <span className="shrink-0">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
