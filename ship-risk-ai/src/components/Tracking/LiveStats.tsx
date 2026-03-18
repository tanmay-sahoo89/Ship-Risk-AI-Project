import React from 'react';
import { Package, AlertTriangle, TrendingUp, Ship } from 'lucide-react';
import type { TrackingStats } from '../../types/tracking';
import { RISK_TIER_COLORS } from '../../utils/constants';

interface LiveStatsProps {
  stats: TrackingStats;
  loading?: boolean;
}

const LiveStats: React.FC<LiveStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex gap-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass rounded-lg px-4 py-2 w-36 h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Total Active */}
      <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
        <Package className="w-4 h-4 text-[var(--accent-color)]" />
        <div>
          <div className="text-xs text-[var(--text-muted)]">Active</div>
          <div className="text-lg font-bold text-[var(--text-heading)]">{stats.total_active}</div>
        </div>
      </div>

      {/* Risk Tiers */}
      {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((tier) => (
        <div
          key={tier}
          className="glass rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: RISK_TIER_COLORS[tier] }}
          />
          <div>
            <div className="text-xs text-[var(--text-muted)]">{tier}</div>
            <div className="text-lg font-bold text-[var(--text-heading)]">{stats.by_risk_tier[tier]}</div>
          </div>
        </div>
      ))}

      {/* Alerts Today */}
      <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-risk-high" />
        <div>
          <div className="text-xs text-[var(--text-muted)]">Alerts</div>
          <div className="text-lg font-bold text-[var(--text-heading)]">{stats.alerts_today}</div>
        </div>
      </div>

      {/* Avg Delay */}
      <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-risk-medium" />
        <div>
          <div className="text-xs text-[var(--text-muted)]">Avg Delay</div>
          <div className="text-lg font-bold text-[var(--text-heading)]">
            {(stats.avg_delay_probability * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Transport Modes */}
      <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
        <Ship className="w-4 h-4 text-[var(--accent-color)]" />
        <div className="flex gap-2 text-xs">
          {Object.entries(stats.by_transport_mode).map(([mode, count]) => (
            <span key={mode} className="text-[var(--text-muted)]">
              {mode}: <span className="text-[var(--text-heading)] font-semibold">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveStats);
