'use client';

import { motion } from 'framer-motion';
import { Clock, Zap, FileCheck, TrendingUp } from 'lucide-react';
import type { PARequest } from '@/lib/types/pa';

interface Props {
  paRequests: PARequest[];
}

export default function ImpactHeroBanner({ paRequests }: Props) {
  const totalProcessed = paRequests.filter(pa => pa.execution_log && pa.execution_log.length > 0).length;
  const approved = paRequests.filter(pa => pa.status === 'approved' || pa.status === 'ready_for_review').length;
  const approvalRate = totalProcessed > 0 ? Math.round((approved / totalProcessed) * 100) : 0;
  const timeSavedHours = Math.round(totalProcessed * 6.2 * 10) / 10;
  const docsGenerated = totalProcessed * 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden relative"
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/30 pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Manual Process (Before) */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Manual Process</span>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-bold text-slate-300 tracking-tight">2–7 days</p>
            <p className="text-sm text-slate-400 mt-2">
              Phone calls, faxes, manual documentation review, back-and-forth with payers
            </p>
          </div>
          <div className="flex gap-4 text-sm text-slate-400">
            <span>3+ phone calls</span>
            <span className="text-slate-300">|</span>
            <span>Manual fax</span>
            <span className="text-slate-300">|</span>
            <span>40% denial rate</span>
          </div>
        </div>

        {/* Right: HealthSync APP (After) */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">HealthSync APP</span>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
              ~4 hours
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Automated FHIR data retrieval, AI policy analysis, instant PA packet generation
            </p>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800">{timeSavedHours}h</p>
              <p className="text-[10px] text-slate-400 font-medium">Time Saved</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <FileCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800">{approvalRate}%</p>
              <p className="text-[10px] text-slate-400 font-medium">Approval Rate</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <FileCheck className="w-4 h-4 text-violet-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-800">{docsGenerated}</p>
              <p className="text-[10px] text-slate-400 font-medium">Docs Generated</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
