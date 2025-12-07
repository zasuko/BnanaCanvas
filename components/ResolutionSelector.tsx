import React from 'react';
import { RESOLUTION_OPTIONS } from '../constants';
import type { Resolution } from '../types';

interface ResolutionSelectorProps {
  selectedResolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ selectedResolution, onResolutionChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-text-secondary mr-2">Resolution:</span>
      <div className="flex bg-surface rounded-lg p-1 border border-border-color">
        {RESOLUTION_OPTIONS.map((res) => (
          <button
            key={res}
            onClick={() => onResolutionChange(res)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              selectedResolution === res
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-main hover:bg-white/5'
            }`}
          >
            {res}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResolutionSelector;