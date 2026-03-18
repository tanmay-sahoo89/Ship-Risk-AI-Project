import React from "react";
import { motion } from "framer-motion";
import { FileText, FileJson } from "lucide-react";
import { exportService } from "../../services/exportService";
import type { ShipmentAlert } from "../../types/alert";
import type { Shipment } from "../../types/shipment";

interface ExportToolbarProps {
  data: ShipmentAlert[] | Shipment[];
  type: "alerts" | "shipments";
  className?: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  data,
  type,
  className = "",
}) => {
  const handleExportCSV = () => {
    if (type === "alerts") {
      exportService.exportAlertsAsCSV(data as ShipmentAlert[]);
    } else {
      exportService.exportShipmentsAsCSV(data as Shipment[]);
    }
  };

  const handleExportPDF = () => {
    if (type === "alerts") {
      exportService.exportAlertsToPDF(data as ShipmentAlert[]);
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-3 ${className}`}
    >
      <span className="text-sm text-light">Export:</span>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleExportCSV}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg glass-light hover:border-accent transition-all"
        title="Export as CSV"
      >
        <FileJson className="w-4 h-4 text-accent" />
        <span className="text-sm text-light">CSV</span>
      </motion.button>

      {type === "alerts" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPDF}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg glass-light hover:border-accent transition-all"
          title="Export as PDF"
        >
          <FileText className="w-4 h-4 text-accent" />
          <span className="text-sm text-light">PDF</span>
        </motion.button>
      )}

      <span className="text-xs text-light/60">({data.length} items)</span>
    </motion.div>
  );
};
