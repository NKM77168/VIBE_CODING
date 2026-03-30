/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, Pause, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gamepad2 } from 'lucide-react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving Up
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isPaused, setIsPaused] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastDirectionRef = useRef<Point>(INITIAL_DIRECTION);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('neon-snake-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-snake-highscore', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
        // Slightly increase speed
        setSpeed((prev) => Math.max(prev - 2, 60));
      } else {
        newSnake.pop();
      }

      lastDirectionRef.current = direction;
      return newSnake;
    });
  }, [direction, food, generateFood]);

  useEffect(() => {
    if (!isPaused && !isGameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPaused, isGameOver, moveSnake, speed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lastDir = lastDirectionRef.current;

      if ((key === 'arrowup' || key === 'w') && lastDir.y === 0) {
        setDirection({ x: 0, y: -1 });
      } else if ((key === 'arrowdown' || key === 's') && lastDir.y === 0) {
        setDirection({ x: 0, y: 1 });
      } else if ((key === 'arrowleft' || key === 'a') && lastDir.x === 0) {
        setDirection({ x: -1, y: 0 });
      } else if ((key === 'arrowright' || key === 'd') && lastDir.x === 0) {
        setDirection({ x: 1, y: 0 });
      } else if (key === ' ') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      {/* Header */}
      <div className="w-full max-w-md flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="w-8 h-8 text-cyan-400" />
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            Neon Snake
          </h1>
        </div>
        <div className="flex w-full justify-between items-center bg-[#151515] border border-white/10 rounded-xl p-4 shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Score</span>
            <span className="text-2xl font-mono font-bold text-cyan-400 leading-none">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">High Score</span>
            </div>
            <span className="text-2xl font-mono font-bold text-emerald-400 leading-none">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div 
          className="relative bg-[#111] border-2 border-white/5 rounded-lg overflow-hidden shadow-inner"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(90vw, 400px)',
            height: 'min(90vw, 400px)',
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ 
                 backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                 backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
               }} 
          />

          {/* Food */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
            style={{
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              left: `${(food.x / GRID_SIZE) * 100}%`,
              top: `${(food.y / GRID_SIZE) * 100}%`,
            }}
          />

          {/* Snake */}
          {snake.map((segment, i) => (
            <div
              key={`${segment.x}-${segment.y}-${i}`}
              className={`absolute transition-all duration-75 ${
                i === 0 
                  ? 'bg-cyan-400 z-10 rounded-sm shadow-[0_0_15px_rgba(34,211,238,0.6)]' 
                  : 'bg-cyan-600/80 rounded-[1px]'
              }`}
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(segment.x / GRID_SIZE) * 100}%`,
                top: `${(segment.y / GRID_SIZE) * 100}%`,
              }}
            />
          ))}

          {/* Overlays */}
          <AnimatePresence>
            {(isPaused || isGameOver) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                {isGameOver ? (
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">Game Over</h2>
                    <p className="text-white/60 mb-6 text-sm uppercase tracking-widest font-bold">Final Score: {score}</p>
                    <button
                      onClick={resetGame}
                      className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-cyan-400 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <h2 className="text-4xl font-black text-white mb-6 uppercase italic tracking-tighter">Paused</h2>
                    <button
                      onClick={() => setIsPaused(false)}
                      className="flex items-center gap-2 bg-cyan-400 text-black px-8 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-white transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Resume
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls / Instructions */}
      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="bg-[#151515] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
          <div className="grid grid-cols-3 gap-1 mb-2">
            <div />
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><ArrowUp className="w-4 h-4" /></div>
            <div />
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></div>
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><ArrowDown className="w-4 h-4" /></div>
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><ArrowRight className="w-4 h-4" /></div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Move</span>
        </div>
        
        <div className="bg-[#151515] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded bg-white/10 text-xs font-mono">SPACE</div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Pause / Play</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold">
        Built with React & Tailwind
      </div>
    </div>
  );
}
