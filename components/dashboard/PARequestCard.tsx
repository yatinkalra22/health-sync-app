'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, User, Stethoscope, Building2, Zap, Bot, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceRing from '@/components/ui/ConfidenceRing';
import { useProcessing } from '@/lib/context/ProcessingContext';
import type { PARequest } from '@/lib/types/pa';

const STEP_LABELS = ['Clinical', 'Policy', 'PA Packet', 'Compliance', 'Done'];

function getStepIndex(elapsed: number): number {
  if (elapsed < 3) return 0;
  if (elapsed < 6) return 1;
  if (elapsed < 10) return 2;
  if (elapsed < 14) return 3;
  return 4;
}

export default function PARequestCard({ pa, index }: { pa: PARequest; index: number }) {
  const { isProcessing, processingPAs } = useProcessing();
  const isStatusProcessing = pa.status === 'processing';
  const isContextProcessing = isProcessing(pa.pa_id);
  const isActivelyProcessing = isStatusProcessing || isContextProcessing;

  const processingEntry = processingPAs.get(pa.pa_id);
  const elapsed = processingEntry?.elapsed ?? 0;
  const stepIdx = getStepIndex(elapsed);
  const progress = isContextProcessing
    ? Math.min(95, (elapsed / 18) * 100)
    : pa.execution_log ? (pa.execution_log.length / 4) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link href={`/pa/${pa.pa_id}`}>
        <div
          className={cn(
            'glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden',
            'hover:-translate-y-0.5',
            isActivelyProcessing && 'pulse-glow border-blue-200/60'
          )}
        >
          {/* Animated gradient border for in-context processing */}
          {isContextProcessing && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.06), rgba(139,92,246,0.05))',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            {/* Left section */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <span className="text-sm font-mono font-bold text-slate-800">
                  {pa.pa_id}
                </span>
                <StatusBadge status={pa.status} size="sm" />
                {pa.urgency === 'expedited' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                    <Zap className="w-3 h-3" />
                    EXPEDITED
                  </span>
                )}
                {isContextProcessing && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <Cpu className="w-3 h-3" />
                    </motion.div>
                    AI Running
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{pa.patient_id}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>CPT {pa.procedure_code}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{pa.payer}</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {formatDistanceToNow(new Date(pa.created_at), { addSuffix: true })}
                </div>
              </div>

              {pa.notes && (
                <p className="text-xs text-slate-400 mt-2 truncate">{pa.notes}</p>
              )}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 self-end sm:self-center">
              {isContextProcessing ? (
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <motion.circle
                      cx="20" cy="20" r="16" fill="none"
                      stroke="url(#proc-grad)" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progress / 100) }}
                      transition={{ duration: 0.8 }}
                    />
                    <defs>
                      <linearGradient id="proc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Bot className="w-4 h-4 text-blue-500 absolute inset-0 m-auto" />
                </div>
              ) : pa.compliance_checks?.confidence_score !== undefined ? (
                <ConfidenceRing score={pa.compliance_checks.confidence_score} size={40} />
              ) : null}
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
            </div>
          </div>

          {/* Processing progress bar */}
          {isActivelyProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isContextProcessing ? (
                    <>
                      <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">
                        {STEP_LABELS[stepIdx]}
                      </span>
                      <div className="flex gap-0.5">
                        {[0,1,2].map(d => (
                          <motion.div key={d} className="w-1 h-1 rounded-full bg-blue-400"
                            animate={{ opacity: [0.3,1,0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Step {pa.execution_log?.length ?? 0} of 4 · {pa.execution_log?.[pa.execution_log.length - 1]?.agent || 'Processing'}
                    </span>
                  )}
                </div>
                {isContextProcessing && (
                  <span className="text-[10px] text-slate-400 tabular-nums">{elapsed}s</span>
                )}
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_100%]"
                  animate={isContextProcessing
                    ? { backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'], width: `${progress}%` }
                    : { width: `${progress}%` }
                  }
                  transition={isContextProcessing
                    ? { backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' }, width: { duration: 0.8 } }
                    : { duration: 0.8, ease: 'easeOut' }
                  }
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

