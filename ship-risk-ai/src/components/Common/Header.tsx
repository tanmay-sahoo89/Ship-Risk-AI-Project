import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Ship,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  ArrowRight,
  X,
  Package,
  TriangleAlert,
  CircleAlert,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useShipmentContext } from "../../contexts/ShipmentContext";
import { useTheme } from "../../contexts/ThemeContext";

type NotifFilter = "all" | "critical" | "high" | "medium" | "low" | "new";

const tierBgClass: Record<string, string> = {
  CRITICAL: "bg-risk-critical",
  HIGH: "bg-risk-high",
  MEDIUM: "bg-risk-medium",
  LOW: "bg-risk-low",
};

const tierIcon: Record<string, React.ReactNode> = {
  CRITICAL: <TriangleAlert className="w-3.5 h-3.5" />,
  HIGH: <CircleAlert className="w-3.5 h-3.5" />,
  MEDIUM: <Info className="w-3.5 h-3.5" />,
  LOW: <Info className="w-3.5 h-3.5" />,
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { alerts, newShipmentEvents } = useShipmentContext();
  const { isDark, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState<NotifFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const criticalCount = alerts.filter((a) => a.risk_tier === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.risk_tier === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.risk_tier === "MEDIUM").length;
  const lowCount = alerts.filter((a) => a.risk_tier === "LOW").length;
  const totalBadge = criticalCount + highCount + newShipmentEvents.length;

  const filteredAlerts =
    notifFilter === "all" || notifFilter === "new"
      ? alerts.slice(0, 15)
      : alerts
          .filter((a) => a.risk_tier === notifFilter.toUpperCase())
          .slice(0, 15);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifs]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass border-b border-white/10 sticky top-0 z-50"
    >
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-1 sm:space-x-3 min-w-0 flex-shrink-0"
          >
            <div className="gradient-primary p-2 rounded-lg flex-shrink-0">
              <Ship
                className="w-6 h-6 sm:w-8 sm:h-8"
                style={{ color: "#fff" }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-2xl font-bold text-white text-shadow leading-tight">
                Ship Risk AI
              </h1>
              <p className="text-xs text-light">Intelligent Risk Management</p>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Notification Bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-light hover:text-accent transition-colors" />
                {totalBadge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-risk-critical text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold"
                    style={{ color: "#fff", fontSize: "0.6rem" }}
                  >
                    {totalBadge > 99 ? "99+" : totalBadge}
                  </motion.span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-10 w-80 sm:w-[420px] max-h-[520px] overflow-y-auto z-50 shadow-2xl rounded-xl p-5 border border-white/10"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      backdropFilter: "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        Notifications
                      </h3>
                      <button onClick={() => setShowNotifs(false)}>
                        <X className="w-5 h-5 text-light hover:text-accent" />
                      </button>
                    </div>

                    {/* Summary badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3 text-sm">
                      <span className="bg-risk-critical px-2 py-0.5 rounded text-xs font-bold" style={{ color: "#fff" }}>
                        {criticalCount} Critical
                      </span>
                      <span className="bg-risk-high px-2 py-0.5 rounded text-xs font-bold" style={{ color: "#fff" }}>
                        {highCount} High
                      </span>
                      <span className="bg-risk-medium px-2 py-0.5 rounded text-xs font-bold" style={{ color: "#fff" }}>
                        {mediumCount} Medium
                      </span>
                      <span className="bg-risk-low px-2 py-0.5 rounded text-xs font-bold" style={{ color: "#fff" }}>
                        {lowCount} Low
                      </span>
                      {newShipmentEvents.length > 0 && (
                        <span className="bg-green-500 px-2 py-0.5 rounded text-xs font-bold" style={{ color: "#fff" }}>
                          {newShipmentEvents.length} New
                        </span>
                      )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(
                        [
                          { key: "all", label: "All" },
                          { key: "critical", label: "Critical" },
                          { key: "high", label: "High" },
                          { key: "medium", label: "Medium" },
                          { key: "low", label: "Low" },
                          ...(newShipmentEvents.length > 0
                            ? [{ key: "new", label: "New" }]
                            : []),
                        ] as { key: NotifFilter; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setNotifFilter(tab.key)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                            notifFilter === tab.key
                              ? "bg-accent/20 text-accent"
                              : "glass-light text-light hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* New Shipment Events */}
                    {(notifFilter === "all" || notifFilter === "new") &&
                      newShipmentEvents.length > 0 && (
                        <div className="mb-3">
                          {notifFilter === "all" && (
                            <h4 className="text-xs font-semibold text-accent mb-2 uppercase tracking-wide">
                              New Shipments
                            </h4>
                          )}
                          <div className="space-y-2">
                            {newShipmentEvents
                              .slice(0, notifFilter === "new" ? 15 : 3)
                              .map((event) => (
                                <button
                                  key={event.shipment_id + event.timestamp}
                                  onClick={() => {
                                    setShowNotifs(false);
                                    navigate(
                                      `/shipments/${event.shipment_id}`,
                                    );
                                  }}
                                  className="w-full text-left glass-light p-3 rounded-lg hover:border-accent transition-all"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                                      <Package className="w-3.5 h-3.5 text-green-400" />
                                      {event.shipment_id}
                                    </span>
                                    <span
                                      className="bg-green-500 px-2 py-0.5 rounded text-xs font-bold"
                                      style={{ color: "#fff" }}
                                    >
                                      NEW
                                    </span>
                                  </div>
                                  <p className="text-xs text-light">
                                    {event.origin} → {event.destination}
                                  </p>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Risk Alerts */}
                    {notifFilter !== "new" && (
                      <>
                        {notifFilter === "all" && filteredAlerts.length > 0 && (
                          <h4 className="text-xs font-semibold text-accent mb-2 uppercase tracking-wide">
                            Risk Alerts
                          </h4>
                        )}
                        {filteredAlerts.length === 0 &&
                        newShipmentEvents.length === 0 ? (
                          <p className="text-sm text-light py-4 text-center">
                            No notifications
                          </p>
                        ) : filteredAlerts.length === 0 ? null : (
                          <div className="space-y-2">
                            {filteredAlerts.map((alert) => (
                              <button
                                key={alert.shipment_id + alert.risk_tier}
                                onClick={() => {
                                  setShowNotifs(false);
                                  navigate(
                                    `/shipments/${alert.shipment_id}`,
                                  );
                                }}
                                className="w-full text-left glass-light p-3 rounded-lg hover:border-accent transition-all group"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-white text-sm flex items-center gap-1.5">
                                    {tierIcon[alert.risk_tier]}
                                    {alert.shipment_id}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-bold ${tierBgClass[alert.risk_tier] || "bg-risk-low"}`}
                                    style={{ color: "#fff" }}
                                  >
                                    {alert.risk_tier}
                                  </span>
                                </div>
                                <p className="text-xs text-light">
                                  {alert.origin} → {alert.destination}
                                </p>
                                <p className="text-xs text-accent mt-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>View details</span>
                                  <ArrowRight className="w-3 h-3" />
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowNotifs(false);
                        navigate("/alerts");
                      }}
                      className="mt-3 w-full text-center text-sm text-accent hover:underline py-2"
                    >
                      View all alerts →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleDarkMode}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:glass-light transition-colors"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-light" />
              )}
            </motion.button>

            {/* User / Auth */}
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="w-5 h-5 text-light" />
                  <span className="text-sm text-light truncate max-w-32">
                    {user.email}
                  </span>
                  {user.userRole && (
                    <span className="text-xs glass-light px-2 py-0.5 rounded text-accent font-medium capitalize">
                      {user.userRole}
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="flex items-center space-x-1 text-light hover:text-accent transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
