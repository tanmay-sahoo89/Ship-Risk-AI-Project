import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TriangleAlert as AlertTriangle, Lightbulb, ChartBar as BarChart3, PlusCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/shipments', icon: Package, label: 'Shipments' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/live-tracking', icon: MapPin, label: 'Live Tracking' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 min-h-screen p-6 border-r border-white/10"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <nav className="space-y-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                    : 'text-light hover:bg-white/5 hover:text-accent'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          </motion.div>
        ))}

        {/* Divider */}
        <div className="border-t border-white/10 my-4"></div>

        {/* Add Shipment */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <NavLink
            to="/add-shipment"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-light hover:bg-white/5 hover:text-accent'
              }`
            }
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">Add Shipment</span>
          </NavLink>
        </motion.div>
      </nav>
    </motion.aside>
  );
};
