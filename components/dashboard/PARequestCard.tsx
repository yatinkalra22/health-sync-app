'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, User, Stethoscope, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceRing from '@/components/ui/ConfidenceRing';
import type { PARequest } from '@/lib/types/pa';

export default function PARequestCard({ pa, index }: { pa: PARequest; index: number }) {
  const isProcessing = pa.status === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link href={`/pa/${pa.pa_id}`}>
        <div
          className={cn(
            'glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group',
            'hover:-translate-y-0.5',
            isProcessing && 'pulse-glow'
          )}
        >
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

            {/* Right section - Confidence + Arrow */}
            <div className="flex items-center gap-4 self-end sm:self-center">
              {pa.compliance_checks?.confidence_score !== undefined && (
                <ConfidenceRing score={pa.compliance_checks.confidence_score} size={40} />
              )}
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
            </div>
          </div>

          {/* Progress bar for processing */}
          {isProcessing && pa.execution_log && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-slate-500 font-medium">
                  Step {pa.execution_log.length} of 4
                </span>
                <span className="text-[10px] text-blue-500 font-medium">
                  {pa.execution_log[pa.execution_log.length - 1]?.agent || 'Processing'}
                </span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(pa.execution_log.length / 4) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
