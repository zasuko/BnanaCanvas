import React from 'react';
import { BACKGROUND_COLORS } from '../constants';

interface BackgroundSettingsProps {
  isBackgroundRemoved: boolean;
  onToggleBackgroundRemoved: (checked: boolean) => void;
  isColorBackground: boolean;
  onToggleColorBackground: (checked: boolean) => void;
  selectedColor: string;
  onColorSelect: (hex: string) => void;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  isBackgroundRemoved,
  onToggleBackgroundRemoved,
  isColorBackground,
  onToggleColorBackground,
  selectedColor,
  onColorSelect,
}) => {
  
  const handleRemoveChange = () => {
      const newState = !isBackgroundRemoved;
      onToggleBackgroundRemoved(newState);
      if (newState) {
          onToggleColorBackground(false);
      }
  };

  const handleColorBackChange = () => {
      const newState = !isColorBackground;
      onToggleColorBackground(newState);
      if (newState) {
          onToggleBackgroundRemoved(false);
      }
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white/60 rounded-2xl border border-white shadow-sm mt-3">
       <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Background</h3>
       
       <div className="flex flex-col sm:flex-row gap-6">
           {/* Background Remover Toggle */}
           <label className="flex items-center gap-3 cursor-pointer group">
               <div className="relative inline-flex items-center">
                   <input 
                       type="checkbox" 
                       className="sr-only peer" 
                       checked={isBackgroundRemoved}
                       onChange={handleRemoveChange}
                   />
                   <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
               </div>
               <span className={`text-base font-bold transition-colors ${isBackgroundRemoved ? 'text-secondary' : 'text-text-secondary group-hover:text-text-main'}`}>
                   Remove BG
               </span>
           </label>

           {/* Color Back Toggle */}
           <label className="flex items-center gap-3 cursor-pointer group">
               <div className="relative inline-flex items-center">
                   <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={isColorBackground}
                       onChange={handleColorBackChange}
                   />
                   <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
               </div>
               <span className={`text-base font-bold transition-colors ${isColorBackground ? 'text-primary' : 'text-text-secondary group-hover:text-text-main'}`}>
                   Color Back
               </span>
           </label>
       </div>

       {/* Color Selector */}
       {isColorBackground && (
           <div className="flex items-center gap-3 mt-1 pl-1 animate-fadeIn bg-white p-2 rounded-xl inline-flex shadow-sm">
               {BACKGROUND_COLORS.map((color) => (
                   <button
                       key={color.id}
                       onClick={() => onColorSelect(color.hex)}
                       className={`w-9 h-9 rounded-full border-2 transition-transform transform hover:scale-110 flex items-center justify-center ${selectedColor === color.hex ? 'border-white scale-110 ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                       style={{ backgroundColor: color.hex }}
                       title={color.name}
                       aria-label={`Select ${color.name}`}
                   />
               ))}
           </div>
       )}
    </div>
  );
};

export default BackgroundSettings;