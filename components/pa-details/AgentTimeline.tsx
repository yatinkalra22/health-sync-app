'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Loader2, XCircle, Bot, ChevronDown, Database } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ExecutionLogEntry } from '@/lib/types/pa';

const stepLabels: Record<string, string> = {
  clinical_data_gathering: 'Clinical Data Gathering',
  policy_analysis: 'Policy Analysis',
  documentation_assembly: 'Documentation Assembly',
  pa_packet_generation: 'PA Packet Generation',
  compliance_validation: 'Compliance Validation',
  error: 'Error',
};

const stepDescriptions: Record<string, string> = {
  clinical_data_gathering: 'Querying patient data via ES|QL across conditions, medications, procedures, and observations indices',
  policy_analysis: 'Running ES|QL policy stats and hybrid search to match coverage criteria against clinical data',
  documentation_assembly: 'Generating medical necessity narrative and assembling PA documentation packet',
  pa_packet_generation: 'Generating medical necessity narrative and assembling PA documentation',
  compliance_validation: 'Validating CMS timeline compliance, documentation completeness, and calculating confidence score',
};

function ESQLQueryBlock({ queries }: { queries: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Database className="w-3 h-3" />
        <span>{queries.length} ES|QL {queries.length === 1 ? 'Query' : 'Queries'}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {queries.map((query, i) => (
                <pre
                  key={i}
                  className="text-[11px] leading-relaxed font-mono bg-slate-900 text-emerald-400 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre"
                >
                  {query}
                </pre>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentTimeline({ executionLog }: { executionLog?: ExecutionLogEntry[] }) {
  if (!executionLog || executionLog.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Agent Workflow</h3>
        <div className="text-center py-8 text-slate-400 text-sm">
          No execution data available yet
        </div>
      </div>
    );
  }

  const stepMap = new Map<string, ExecutionLogEntry>();
  for (const entry of executionLog) {
    stepMap.set(entry.step, entry);
  }
  const steps = Array.from(stepMap.values());

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-slate-800">Agent Workflow</h3>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const StatusIcon =
            step.status === 'completed' ? CheckCircle2 :
            step.status === 'failed' ? XCircle :
            Loader2;
          const statusColor =
            step.status === 'completed' ? 'text-emerald-500' :
            step.status === 'failed' ? 'text-rose-500' :
            'text-blue-500';

          return (
            <motion.div
              key={`${step.step}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white z-10',
                  step.status === 'completed' ? 'border-emerald-200' :
                  step.status === 'failed' ? 'border-rose-200' :
                  'border-blue-200'
                )}>
                  <StatusIcon className={cn('w-4 h-4', statusColor, step.status === 'started' && 'animate-spin')} />
                </div>
                {!isLast && (
                  <div className="w-0.5 h-full min-h-[40px] bg-slate-200" />
                )}
              </div>

              <div className="pb-6 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {stepLabels[step.step] || step.step}
                  </h4>
                  {step.agent && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-mono">
                      {step.agent}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-1">
                  {stepDescriptions[step.step] || ''}
                </p>
                {step.result_summary && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5 inline-block mt-1">
                    {step.result_summary}
                  </p>
                )}
                {step.error && (
                  <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-1.5 inline-block mt-1">
                    {step.error}
                  </p>
                )}
                {step.esql_queries && step.esql_queries.length > 0 && (
                  <ESQLQueryBlock queries={step.esql_queries} />
                )}
                {step.timestamp && (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
