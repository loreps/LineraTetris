import { useState, useCallback, useEffect } from 'react';
import { TetrisLineraClient, GameState } from '../lib/lineraClient';
import { supabase } from '../lib/supabaseClient';

const CONTRACT_ID = import.meta.env.VITE_LINERA_CONTRACT_ID || '';
const PRIVATE_KEY = import.meta.env.VITE_LINERA_PRIVATE_KEY || '';

export const useLineraGameLogic = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerNickname, setPlayerNickname] = useState<string | null>(null);
  const [client, setClient] = useState<TetrisLineraClient | null>(null);

  useEffect(() => {
    if (CONTRACT_ID && PRIVATE_KEY) {
      setClient(new TetrisLineraClient(CONTRACT_ID, PRIVATE_KEY));
    }
  }, []);

  useEffect(() => {
    if (client) {
      const fetchGameState = async () => {
        const state = await client.getGameState();
        setGameState(state);
        setScore(state.score);
        setGameOver(state.gameOver);
      };

      fetchGameState();
      const interval = setInterval(fetchGameState, 1000);
      return () => clearInterval(interval);
    }
  }, [client]);

  const startGame = useCallback(async () => {
    if (!client) return;
    const response = await client.startGame();
    if (response.success && response.gameState) {
      setGameState(response.gameState);
      setScore(response.gameState.score);
      setGameOver(response.gameState.gameOver);
    }
  }, [client]);

  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    if (!client || gameOver) return;

    switch (event.key) {
      case 'ArrowLeft':
        await client.moveLeft();
        break;
      case 'ArrowRight':
        await client.moveRight();
        break;
      case 'ArrowUp':
        await client.rotate();
        break;
      case 'ArrowDown':
        await client.drop();
        break;
      case ' ':
        while (!gameOver) {
          await client.drop();
        }
        break;
    }
  }, [client, gameOver]);

  const resetGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  const saveHighScore = async () => {
    if (!playerNickname || score === 0) return;

    try {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('high_score')
        .eq('nickname', playerNickname)
        .single();

      if (existingPlayer) {
        if (score > existingPlayer.high_score) {
          await supabase
            .from('players')
            .update({ high_score: score })
            .eq('nickname', playerNickname);
        }
      }
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  };

  useEffect(() => {
    if (gameOver) {
      saveHighScore();
    }
  }, [gameOver, score, playerNickname]);

  return {
    gameState,
    score,
    startGame,
    handleKeyPress,
    gameOver,
    resetGame,
    setPlayerNickname,
  };
}; 