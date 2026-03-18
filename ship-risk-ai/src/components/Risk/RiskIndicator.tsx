import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RiskIndicatorProps {
  current: number;
  previous?: number;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  current,
  previous,
  showTrend = true,
  size = 'md',
}) => {
  const getTrend = () => {
    if (!previous) return 'stable';
    if (current > previous) return 'increasing';
    if (current < previous) return 'decreasing';
    return 'stable';
  };

  const trend = getTrend();
  const change = previous ? ((current - previous) / previous) * 100 : 0;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const getColor = () => {
    if (current >= 0.9) return '#DC2626';
    if (current >= 0.6) return '#F97316';
    if (current >= 0.3) return '#F59E0B';
    return '#10B981';
  };

  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - current * circumference;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <svg className={sizeClasses[size]} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSizeClasses[size]} font-bold text-white`}>
            {Math.round(current * 100)}%
          </span>
        </div>
      </div>

      {showTrend && previous !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-sm"
        >
          {trend === 'increasing' && <TrendingUp className="w-4 h-4 text-red-400" />}
          {trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-400" />}
          {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
          <span
            className={
              trend === 'increasing'
                ? 'text-red-400'
                : trend === 'decreasing'
                ? 'text-green-400'
                : 'text-gray-400'
            }
          >
            {trend === 'stable' ? 'No change' : `${Math.abs(change).toFixed(1)}%`}
          </span>
        </motion.div>
      )}
    </div>
  );
};
