'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return Number(value.toFixed(1));
}

const CONFETTI_COLORS = [
  '#3B82F6', '#06B6D4', '#10B981', '#8B5CF6', '#F59E0B',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
];

interface Props {
  confidenceScore: number;
  onDismiss: () => void;
}

export default function CompletionCelebration({ confidenceScore, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);
  const timeSaved = useAnimatedNumber(6.2, 1500);
  const showConfetti = confidenceScore >= 0.8;

  const confettiPieces = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: Math.random() * 360,
      size: 4 + Math.random() * 6,
    })), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          {/* Confetti */}
          {showConfetti && confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                opacity: 1,
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                opacity: [1, 1, 0],
                y: '100vh',
                rotate: piece.rotation + 720,
                scale: [1, 1.2, 0.8],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn',
              }}
              className="fixed top-0 pointer-events-none"
              style={{
                width: piece.size,
                height: piece.size * 1.5,
                backgroundColor: piece.color,
                borderRadius: 2,
              }}
            />
          ))}

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="glass-card rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl relative z-10 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, damping: 12 }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            <h2 className="text-xl font-bold text-slate-800 mb-1">Processing Complete!</h2>
            <p className="text-sm text-slate-500 mb-5">
              AI agents have finished analyzing this request
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10 p-4 mb-5"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Estimated Time Saved</span>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                ~{timeSaved} hours
              </p>
              <p className="text-[10px] text-slate-400 mt-1">vs. traditional manual process</p>
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
              <span>Confidence: <strong className="text-slate-700">{Math.round(confidenceScore * 100)}%</strong></span>
            </div>

            <button
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/25 transition-all text-sm font-semibold"
            >
              View Full Results
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
