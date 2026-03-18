import React, { useState } from 'react';
import { AlertTriangle, CloudRain, Navigation, Radio } from 'lucide-react';
import type { TrackingEvent, TrackingEventType } from '../../types/tracking';

interface EventFeedProps {
  events: TrackingEvent[];
  onEventClick?: (shipmentId: string) => void;
}

const EVENT_ICONS: Record<TrackingEventType, React.ReactNode> = {
  alert: <AlertTriangle className="w-3.5 h-3.5 text-risk-critical" />,
  weather: <CloudRain className="w-3.5 h-3.5 text-blue-400" />,
  position_update: <Navigation className="w-3.5 h-3.5 text-green-400" />,
  intervention: <Radio className="w-3.5 h-3.5 text-purple-400" />,
  status_change: <AlertTriangle className="w-3.5 h-3.5 text-risk-medium" />,
};

const SEVERITY_COLORS = {
  info: 'border-l-blue-400',
  warning: 'border-l-risk-medium',
  critical: 'border-l-risk-critical',
};

const EventFeed: React.FC<EventFeedProps> = ({ events, onEventClick }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'weather'>('all');

  const filtered = events.filter((e) => {
    if (filter === 'critical') return e.severity === 'critical';
    if (filter === 'weather') return e.type === 'weather';
    return true;
  });

  const visibleEvents = filtered.slice(0, 20);

  return (
    <div className="p-3">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-sm font-semibold text-[var(--text-heading)]">Live Events</span>
          <span className="text-xs text-[var(--text-muted)]">({events.length})</span>
        </div>
        <div className="flex gap-1">
          {(['all', 'critical', 'weather'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                filter === f
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'critical' ? 'Critical' : 'Weather'}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {visibleEvents.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] py-2">No events to display</div>
        ) : (
          visibleEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event.shipment_id)}
              className={`shrink-0 glass rounded-lg px-3 py-2 border-l-2 text-left hover:bg-[var(--bg-glass-light)] transition-colors max-w-xs ${
                SEVERITY_COLORS[event.severity]
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {EVENT_ICONS[event.type]}
                <span className="text-xs font-medium text-[var(--text-heading)]">
                  {event.shipment_id}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] line-clamp-2">{event.message}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(EventFeed);
