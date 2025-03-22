import React, { useEffect, useState } from 'react';

const COLORS = ['text-emerald-400', 'text-red-400', 'text-rose-400'];
const SHAPES = ['L', 'I', 'T', 'O'];

interface Block {
  id: number;
  color: string;
  shape: string;
  left: number;
  delay: number;
}

export const TetrisBackground: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const createBlock = (id: number): Block => ({
      id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      left: Math.random() * 100,
      delay: Math.random() * 2
    });

    const initialBlocks = Array.from({ length: 20 }, (_, i) => createBlock(i));
    setBlocks(initialBlocks);

    const interval = setInterval(() => {
      setBlocks(prev => {
        const newBlocks = [...prev];
        const blockToUpdate = Math.floor(Math.random() * newBlocks.length);
        newBlocks[blockToUpdate] = createBlock(prev[blockToUpdate].id);
        return newBlocks;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {blocks.map(block => (
        <div
          key={block.id}
          className={`tetris-bg-block ${block.color}`}
          style={{
            left: `${block.left}%`,
            animationDelay: `${block.delay}s`
          }}
        >
          {block.shape}
        </div>
      ))}
    </div>
  );
};