import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LayerVisibility } from '../../types/tracking';

interface LayerControlsProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
}

const LAYER_CONFIG: { key: keyof LayerVisibility; label: string; icon: string }[] = [
  { key: 'shipments', label: 'Shipments', icon: '📦' },
  { key: 'routes', label: 'Routes', icon: '🛤️' },
  { key: 'weather', label: 'Weather', icon: '🌤️' },
  { key: 'aircraft', label: 'Aircraft', icon: '✈️' },
  { key: 'vessels', label: 'Vessels', icon: '🚢' },
];

const LayerControls: React.FC<LayerControlsProps> = ({ layers, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {LAYER_CONFIG.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            layers[key]
              ? 'glass text-[var(--text-heading)] shadow-sm'
              : 'bg-transparent text-[var(--text-muted)] border border-[var(--border-color)]'
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
          {layers[key] ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3 opacity-50" />
          )}
        </button>
      ))}
    </div>
  );
};

export default React.memo(LayerControls);
