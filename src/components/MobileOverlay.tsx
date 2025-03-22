import React from 'react';
import { Monitor } from 'lucide-react';

export const MobileOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900/50 p-8 rounded-2xl text-center max-w-md border-2 border-blue-500">
        <Monitor className="w-16 h-16 text-blue-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-blue-500 mb-4">PC Only Game</h2>
        <p className="text-lg text-gray-300 mb-2">
          This game is only available on desktop computers.
        </p>
        <p className="text-gray-400">
          Please open it on your PC to play.
        </p>
      </div>
    </div>
  );
};