import React, { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Leaderboard } from './components/Leaderboard';
import { Instructions } from './components/Instructions';
import { GameOverModal } from './components/GameOverModal';
import { MobileOverlay } from './components/MobileOverlay';
import { AccountModal } from './components/AccountModal';
import { useLineraGameLogic } from './hooks/useLineraGameLogic';
import { Gamepad } from 'lucide-react';
import { TetrisBackground } from './components/TetrisBackground';

function App() {
  const {
    gameState,
    score,
    startGame,
    handleKeyPress,
    gameOver,
    resetGame,
    setPlayerNickname
  } = useLineraGameLogic();

  const [isMobile, setIsMobile] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const savedNickname = localStorage.getItem('playerNickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setPlayerNickname(savedNickname);
    }
  }, [setPlayerNickname]);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent);
      const isSmallScreen = window.innerWidth <= 900;
      setIsMobile(isMobileDevice || isTablet || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleAccountSuccess = (newNickname: string) => {
    setNickname(newNickname);
    setPlayerNickname(newNickname);
    localStorage.setItem('playerNickname', newNickname);
  };

  if (isMobile) {
    return <MobileOverlay />;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <TetrisBackground />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Gamepad className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-emerald-600">
              LineTetris
            </h1>
          </div>
          <button 
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            onClick={() => setIsAccountModalOpen(true)}
          >
            {nickname ? `Playing as ${nickname}` : 'Connect Account'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr_250px] gap-8">
          <Leaderboard />
          
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-xl mb-6 w-full text-center shadow-xl border border-emerald-100">
              <p className="text-2xl font-semibold text-emerald-900">
                Score: <span className="text-red-600 font-bold">{score}</span>
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-2xl border border-emerald-100">
              <GameBoard gameState={gameState?.board || []} currentPiece={gameState?.currentPiece || null} />
            </div>
            
            <button
              onClick={startGame}
              className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Game
            </button>
          </div>

          <Instructions />
        </div>
      </div>

      <footer className="absolute bottom-0 w-full py-4 text-center text-emerald-600 bg-white/80">
        <p>Created for Linera with ❤️</p>
      </footer>

      <GameOverModal 
        isOpen={gameOver}
        score={score}
        onRestart={resetGame}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={handleAccountSuccess}
      />
    </div>
  );
}

export default App;