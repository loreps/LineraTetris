import React from 'react';
import { Keyboard } from 'lucide-react';

export const Instructions: React.FC = () => {
  return (
    <div className="glass-effect p-6 rounded-xl border border-white/20">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Keyboard className="w-6 h-6 text-emerald-600" />
        <h3 className="text-xl font-semibold text-emerald-900">Controls</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
          <kbd className="px-2.5 py-1.5 bg-white rounded text-sm font-medium text-emerald-900 shadow">Up</kbd>
          <span className="text-emerald-900">Rotate piece</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
          <kbd className="px-2.5 py-1.5 bg-white rounded text-sm font-medium text-emerald-900 shadow">Left</kbd>
          <span className="text-emerald-900">Move left</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
          <kbd className="px-2.5 py-1.5 bg-white rounded text-sm font-medium text-emerald-900 shadow">Rigt</kbd>
          <span className="text-emerald-900">Move right</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
          <kbd className="px-2.5 py-1.5 bg-white rounded text-sm font-medium text-emerald-900 shadow">Down</kbd>
          <span className="text-emerald-900">Move down</span>
        </div>
        <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
          <kbd className="px-2.5 py-1.5 bg-white rounded text-sm font-medium text-emerald-900 shadow">Space</kbd>
          <span className="text-emerald-900">Drop piece</span>
        </div>
      </div>
    </div>
  );
};