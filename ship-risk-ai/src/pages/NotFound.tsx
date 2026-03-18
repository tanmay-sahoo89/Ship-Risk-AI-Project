import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hop as Home, TriangleAlert as AlertTriangle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="mb-8">
          <AlertTriangle className="w-24 h-24 text-accent mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-light mb-2">Page Not Found</h2>
          <p className="text-light">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link to="/" className="btn-primary inline-flex items-center space-x-2">
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </motion.div>
    </div>
  );
};
