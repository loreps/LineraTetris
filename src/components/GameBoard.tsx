import React from 'react';
import { GameState, Tetromino } from '../types';

interface GameBoardProps {
  gameState: GameState;
  currentPiece?: Tetromino | null;
}

const COLORS = {
  'I': 'bg-cyan-500',
  'O': 'bg-yellow-500',
  'T': 'bg-purple-500',
  'S': 'bg-green-500',
  'Z': 'bg-red-500',
  'J': 'bg-blue-500',
  'L': 'bg-orange-500',
  'B': 'bg-black' // Black block color
};

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, currentPiece }) => {
  const renderBoard = () => {
    const board = gameState.map(row => [...row]);

    if (currentPiece) {
      let shape = TETROMINOES[currentPiece.type].shape;
      const { x, y } = currentPiece.position;

      // Apply rotation (except for black block)
      if (currentPiece.type !== 'B') {
        for (let i = 0; i < currentPiece.rotation; i++) {
          shape = rotateMatrix(shape);
        }
      }

      for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
          if (shape[i][j] && y + i >= 0 && y + i < board.length && x + j >= 0 && x + j < board[0].length) {
            board[y + i][x + j] = currentPiece.type;
          }
        }
      }
    }

    return board;
  };

  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const rotated = matrix.map((row, i) => 
      row.map((_, j) => matrix[N - 1 - j][i])
    );
    return rotated;
  };

  const TETROMINOES = {
    'I': {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    },
    'O': {
      shape: [
        [1, 1],
        [1, 1]
      ]
    },
    'T': {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    'S': {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ]
    },
    'Z': {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ]
    },
    'J': {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    'L': {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    'B': {
      shape: [
        [1]
      ]
    }
  };

  return (
    <div className="w-[420px] h-[600px] bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20">
      <div className="grid grid-cols-14 grid-rows-20 gap-[1px] h-full">
        {renderBoard().map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`
                ${cell ? COLORS[cell] : 'bg-gray-800'}
                ${cell ? 'shadow-inner' : ''}
                transition-colors duration-100
              `}
            />
          ))
        )}
      </div>
    </div>
  );
};