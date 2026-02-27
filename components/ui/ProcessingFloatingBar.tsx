'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronRight, X, Cpu } from 'lucide-react';
import { useProcessing } from '@/lib/context/ProcessingContext';

const AGENT_STEPS = [
  'Clinical Data',
  'Policy Analysis',
  'PA Packet',
  'Compliance',
  'Finalizing',
];

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function getStepIndex(elapsed: number): number {
  // Cycle through steps based on elapsed time
  if (elapsed < 3) return 0;
  if (elapsed < 6) return 1;
  if (elapsed < 10) return 2;
  if (elapsed < 14) return 3;
  return Math.min(4, Math.floor(elapsed / 3) % 5);
}

export default function ProcessingFloatingBar() {
  const { processingList, finishProcessing } = useProcessing();
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50 flex flex-col gap-2 items-center lg:items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {processingList.map((item) => {
          const stepIdx = getStepIndex(item.elapsed);
          const stepLabel = AGENT_STEPS[stepIdx];
          const progress = Math.min(95, (item.elapsed / 18) * 100);

          return (
            <motion.div
              key={item.paId}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto"
            >
              <div
                onClick={() => router.push(`/pa/${item.paId}`)}
                className="group flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer select-none
                  bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/40
                  hover:border-blue-500/60 hover:shadow-blue-500/20 transition-all duration-300
                  w-[calc(100vw-2rem)] max-w-sm lg:w-80"
                style={{ minWidth: 0 }}
              >
                {/* Animated bot icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Bot className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white font-mono truncate">{item.paId}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">{formatElapsed(item.elapsed)}</span>
                  </div>

                  {/* Animated step label */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Cpu className="w-3 h-3 text-blue-400 flex-shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={stepLabel}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-[10px] text-blue-300 font-medium truncate"
                      >
                        {stepLabel}…
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_100%]"
                      animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Navigate arrow */}
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />

                {/* Dismiss button */}
                <button
                  onClick={(e) => { e.stopPropagation(); finishProcessing(item.paId); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:border-rose-400"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>

              {/* Dot indicators for steps */}
              <div className="flex justify-center gap-1 mt-1.5">
                {AGENT_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      i <= stepIdx ? 'bg-blue-400 w-4' : 'bg-slate-700 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

