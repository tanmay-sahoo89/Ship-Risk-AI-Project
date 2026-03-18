import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useShipmentContext } from "../../contexts/ShipmentContext";
import { RISK_TIER_COLORS } from "../../utils/constants";
import { motion } from "framer-motion";

export const RiskDistributionChart: React.FC = () => {
  const { metrics, loading } = useShipmentContext();

  if (loading || !metrics) {
    return (
      <div className="card animate-pulse">
        <div className="h-80 bg-white/5 rounded"></div>
      </div>
    );
  }

  const data = [
    {
      name: "Critical",
      value: metrics.critical_alerts,
      color: RISK_TIER_COLORS.CRITICAL,
    },
    { name: "High", value: metrics.high_alerts, color: RISK_TIER_COLORS.HIGH },
    {
      name: "Medium",
      value: metrics.medium_alerts,
      color: RISK_TIER_COLORS.MEDIUM,
    },
    { name: "Low", value: metrics.low_alerts, color: RISK_TIER_COLORS.LOW },
  ];

  const customLabel = ({ percent, x, y }: any) => {
    const percentage = ((percent || 0) * 100).toFixed(0);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold pointer-events-none"
        style={{
          textShadow: "0 0 4px rgba(0,0,0,0.8)",
          filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
        }}
      >
        {`${percentage}%`}
      </text>
    );
  };

  const isMobile = window.innerWidth < 768;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card"
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-6">
        Risk Distribution
      </h3>
      <ResponsiveContainer width="100%" height={isMobile ? 280 : 300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={customLabel}
            outerRadius={isMobile ? 70 : 90}
            innerRadius={isMobile ? 40 : 50}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 15, 15, 0.95)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 12px",
            }}
            formatter={(value) => [`${value} alerts`, "Count"]}
          />
          <Legend
            wrapperStyle={{
              color: "#BEA8A7",
              paddingTop: "16px",
              fontSize: isMobile ? "12px" : "14px",
            }}
            iconType="circle"
            verticalAlign="bottom"
            height={36}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
