import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { TrackedShipment } from '../../types/tracking';

interface SearchBarProps {
  shipments: TrackedShipment[];
  onSelectShipment: (shipment: TrackedShipment) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ shipments, onSelectShipment }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return shipments
      .filter(
        (s) =>
          s.shipment_id.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.carrier.toLowerCase().includes(q) ||
          s.shipment_status?.toLowerCase().includes(q) ||
          s.transport_mode?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, shipments]);

  const totalMatches = useMemo(() => {
    if (!query.trim()) return shipments.length;
    const q = query.toLowerCase();
    return shipments.filter(
      (s) =>
        s.shipment_id.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q) ||
        s.shipment_status?.toLowerCase().includes(q) ||
        s.transport_mode?.toLowerCase().includes(q)
    ).length;
  }, [query, shipments]);

  return (
    <div className="relative w-full">
      <div className="flex items-center glass rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-[var(--text-muted)] mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search shipment ID, city, carrier..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="bg-transparent border-none outline-none text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] w-full"
        />
        {query && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[var(--text-muted)]">
              {totalMatches}/{shipments.length}
            </span>
            <button onClick={() => { setQuery(''); setOpen(false); }}>
              <X className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-heading)]" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 glass rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            results.map((s) => (
              <button
                key={s.shipment_id}
                onClick={() => {
                  onSelectShipment(s);
                  setQuery(s.shipment_id);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-glass-light)] transition-colors flex items-center justify-between border-b border-[var(--border-color)] last:border-b-0"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--text-heading)]">{s.shipment_id}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {s.origin} → {s.destination} · {s.carrier}
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{
                    backgroundColor:
                      s.risk_tier === 'CRITICAL' ? '#dc2626' :
                      s.risk_tier === 'HIGH' ? '#ea580c' :
                      s.risk_tier === 'MEDIUM' ? '#ca8a04' : '#16a34a',
                  }}
                >
                  {s.risk_tier}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                No shipments found matching "<span className="text-[var(--text-heading)]">{query}</span>"
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Try searching by ID, city, or carrier name
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchBar);
