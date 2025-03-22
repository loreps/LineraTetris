import React from 'react';
import { Gamepad } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  onRestart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="glass-effect p-12 rounded-2xl text-center max-w-md mx-4 border border-white/20 shadow-2xl">
        <Gamepad className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-emerald-900 mb-4">Game Over!</h2>
        <p className="text-xl mb-8 text-emerald-900">
          Your score: <span className="text-red-600 font-bold">{score}</span>
        </p>
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-red-600 hover:from-emerald-500 hover:to-red-500 text-white rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};