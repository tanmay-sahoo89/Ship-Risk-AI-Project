import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Ship,
  TriangleAlert,
  Lightbulb,
  ChartBar as BarChart,
  ArrowRight,
} from "lucide-react";
import { LoginModal } from "../components/Auth/LoginModal";
import type { UserRole } from "../types/user";

export const Home: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleSelectRole = (role: UserRole) => {
    setShowLoginModal(false);
    navigate(`/login?role=${role}`);
  };

  const features = [
    {
      icon: TriangleAlert,
      title: "Real-time Risk Monitoring",
      description: "AI-powered early warning system for shipment delays",
    },
    {
      icon: Lightbulb,
      title: "Smart Recommendations",
      description: "Automated intervention suggestions to prevent delays",
    },
    {
      icon: BarChart,
      title: "Advanced Analytics",
      description: "Comprehensive insights into shipping performance",
    },
  ];

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="gradient-primary p-6 rounded-2xl inline-block mb-8"
          >
            <Ship className="w-20 h-20 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-bold text-white mb-6 text-shadow"
          >
            Ship Risk AI
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl text-light mb-12"
          >
            Intelligent Shipment Risk Management & Early Warning System
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center space-x-4"
          >
            <button
              onClick={() => setShowLoginModal(true)}
              className="btn-primary flex items-center space-x-2 text-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="btn-secondary flex items-center space-x-2 text-lg"
            >
              <span>Sign In</span>
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="card text-center hover:scale-105"
            >
              <div className="gradient-primary p-4 rounded-xl inline-block mb-4">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-light">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {showLoginModal && (
        <LoginModal
          onSelectRole={handleSelectRole}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};
