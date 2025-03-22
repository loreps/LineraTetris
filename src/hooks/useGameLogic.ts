import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Tetromino } from '../types';
import { supabase } from '../lib/supabaseClient';

const BOARD_WIDTH = 14;
const BOARD_HEIGHT = 20;
const DROP_INTERVAL = 150;
const BLACK_BLOCK_CHANCE = 0.1;

const TETROMINOES = {
  'I': {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'I'
  },
  'O': {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'O'
  },
  'T': {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'T'
  },
  'S': {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'S'
  },
  'Z': {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'Z'
  },
  'J': {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'J'
  },
  'L': {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'L'
  },
  'B': {
    shape: [
      [1]
    ],
    color: 'B'
  }
} as const;

type TetrominoType = keyof typeof TETROMINOES;

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const dropInterval = useRef<number | null>(null);
  const lastDropTime = useRef<number>(Date.now());
  const [playerNickname, setPlayerNickname] = useState<string | null>(null);

  const clearMatchingBlocks = (x: number, y: number, board: GameState, colorToRemove: CellType) => {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if (board[row][col] === colorToRemove) {
          board[row][col] = null;
        }
      }
    }
    return board;
  };

  const createEmptyBoard = () => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

  const getRandomTetromino = (): TetrominoType => {
    if (Math.random() < BLACK_BLOCK_CHANCE) {
      return 'B';
    }
    const pieces = Object.keys(TETROMINOES).filter(key => key !== 'B') as TetrominoType[];
    return pieces[Math.floor(Math.random() * pieces.length)];
  };

  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const rotated = matrix.map((row, i) => 
      row.map((_, j) => matrix[N - 1 - j][i])
    );
    return rotated;
  };

  const isValidMove = (piece: Tetromino, newX: number, newY: number, rotatedShape?: number[][]): boolean => {
    const shape = rotatedShape || TETROMINOES[piece.type].shape;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          
          if (
            boardX < 0 || 
            boardX >= BOARD_WIDTH || 
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && gameState[boardY]?.[boardX] !== null)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

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

  const spawnNewPiece = useCallback(() => {
    const type = getRandomTetromino();
    const newPiece: Tetromino = {
      type,
      position: { 
        x: Math.floor((BOARD_WIDTH - TETROMINOES[type].shape[0].length) / 2),
        y: -1
      },
      rotation: 0
    };

    if (!isValidMove(newPiece, newPiece.position.x, newPiece.position.y)) {
      setGameOver(true);
      saveHighScore();
      return false;
    }

    setCurrentPiece(newPiece);
    lastDropTime.current = Date.now();
    return true;
  }, [gameState, playerNickname, score]);

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = gameState.map(row => [...row]);
    let rotatedShape = TETROMINOES[currentPiece.type].shape;
    
    for (let i = 0; i < currentPiece.rotation; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }

    // Find the color of the block that the black block touches
    let touchedColor: CellType = null;
    if (currentPiece.type === 'B') {
      const { x, y } = currentPiece.position;
      // Check surrounding cells
      const directions = [
        { dx: 0, dy: 1 }, // down
        { dx: 1, dy: 0 }, // right
        { dx: -1, dy: 0 }, // left
        { dx: 0, dy: -1 } // up
      ];
      
      for (const { dx, dy } of directions) {
        const newX = x + dx;
        const newY = y + dy;
        if (
          newY >= 0 && newY < BOARD_HEIGHT &&
          newX >= 0 && newX < BOARD_WIDTH &&
          newBoard[newY][newX] !== null &&
          newBoard[newY][newX] !== 'B'
        ) {
          touchedColor = newBoard[newY][newX];
          break;
        }
      }
    }

    // Handle black block effect before merging the piece
    if (currentPiece.type === 'B' && touchedColor) {
      // Clear matching blocks
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
          if (newBoard[row][col] === touchedColor) {
            newBoard[row][col] = null;
          }
        }
      }
      // Don't merge the black block
      spawnNewPiece();
      setGameState(newBoard);
      return;
    }

    // Merge the piece if it's not a black block
    for (let y = 0; y < rotatedShape.length; y++) {
      for (let x = 0; x < rotatedShape[y].length; x++) {
        if (rotatedShape[y][x]) {
          const boardY = currentPiece.position.y + y;
          const boardX = currentPiece.position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }

    // Check for completed lines
    let completedLines = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        completedLines++;
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }
    }

    // Update score
    if (completedLines > 0) {
      const newScore = score + (completedLines * 100);
      setScore(newScore);
      saveHighScore();
    }

    setGameState(newBoard);
    spawnNewPiece();
  }, [currentPiece, gameState, spawnNewPiece, score]);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver || !isGameStarted) return;

    const newX = currentPiece.position.x + dx;
    const newY = currentPiece.position.y + dy;

    let rotatedShape = TETROMINOES[currentPiece.type].shape;
    for (let i = 0; i < currentPiece.rotation; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }

    if (isValidMove(currentPiece, newX, newY, rotatedShape)) {
      setCurrentPiece({
        ...currentPiece,
        position: { x: newX, y: newY }
      });
      if (dy > 0) {
        lastDropTime.current = Date.now();
      }
    } else if (dy > 0) {
      mergePiece();
    }
  }, [currentPiece, gameOver, isGameStarted, mergePiece]);

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || !isGameStarted) return;
    
    let newY = currentPiece.position.y;
    let rotatedShape = TETROMINOES[currentPiece.type].shape;
    for (let i = 0; i < currentPiece.rotation; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }

    while (isValidMove(currentPiece, currentPiece.position.x, newY + 1, rotatedShape)) {
      newY++;
    }
    
    setCurrentPiece({
      ...currentPiece,
      position: { ...currentPiece.position, y: newY }
    });
    
    mergePiece();
  }, [currentPiece, gameOver, isGameStarted, mergePiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || !isGameStarted || currentPiece.type === 'B') return;

    const newRotation = (currentPiece.rotation + 1) % 4;
    let rotatedShape = TETROMINOES[currentPiece.type].shape;
    for (let i = 0; i < newRotation; i++) {
      rotatedShape = rotateMatrix(rotatedShape);
    }

    if (isValidMove(currentPiece, currentPiece.position.x, currentPiece.position.y, rotatedShape)) {
      setCurrentPiece({
        ...currentPiece,
        rotation: newRotation
      });
    }
  }, [currentPiece, gameOver, isGameStarted]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameOver || !isGameStarted) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePiece(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePiece(1, 0);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        movePiece(0, 1);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        rotatePiece();
        break;
      case ' ':
        dropPiece();
        break;
    }
  }, [movePiece, rotatePiece, dropPiece, gameOver, isGameStarted]);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (isGameStarted && !gameOver && currentPiece) {
        const now = Date.now();
        if (now - lastDropTime.current >= DROP_INTERVAL) {
          movePiece(0, 1);
        }
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (isGameStarted && !gameOver) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isGameStarted, gameOver, currentPiece, movePiece]);

  const startGame = useCallback(() => {
    if (!playerNickname) {
      alert('Please connect your account first!');
      return;
    }

    setGameState(createEmptyBoard());
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
    lastDropTime.current = Date.now();
    spawnNewPiece();
  }, [spawnNewPiece, playerNickname]);

  const resetGame = useCallback(() => {
    setIsGameStarted(false);
    startGame();
  }, [startGame]);

  return {
    gameState,
    score,
    startGame,
    handleKeyPress,
    gameOver,
    resetGame,
    currentPiece,
    setPlayerNickname
  };
};