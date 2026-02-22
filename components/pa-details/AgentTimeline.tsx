'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Loader2, XCircle, Bot } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ExecutionLogEntry } from '@/lib/types/pa';

const stepLabels: Record<string, string> = {
  clinical_data_gathering: 'Clinical Data Gathering',
  policy_analysis: 'Policy Analysis',
  pa_packet_generation: 'PA Packet Generation',
  compliance_validation: 'Compliance Validation',
  error: 'Error',
};

const stepDescriptions: Record<string, string> = {
  clinical_data_gathering: 'Retrieving patient demographics, conditions, medications, and procedures from FHIR/Elasticsearch',
  policy_analysis: 'Matching payer policies and analyzing coverage criteria against clinical data',
  pa_packet_generation: 'Generating medical necessity narrative and assembling PA documentation',
  compliance_validation: 'Running compliance checks and calculating confidence score',
};

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
