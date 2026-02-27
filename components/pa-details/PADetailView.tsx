'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Clock, Building2, Stethoscope, FileText, Loader2, CheckCircle2, Bot, Cpu, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceRing from '@/components/ui/ConfidenceRing';
import PatientInfo from './PatientInfo';
import ClinicalDataPanel from './ClinicalDataPanel';
import PolicyAnalysisPanel from './PolicyAnalysisPanel';
import PAPacketPanel from './PAPacketPanel';
import AgentTimeline from './AgentTimeline';
import CompletionCelebration from './CompletionCelebration';
import { approvePARequest, denyPARequest, processPA } from '@/actions/pa-actions';
import { useProcessing } from '@/lib/context/ProcessingContext';
import type { PARequest, ExecutionLogEntry } from '@/lib/types/pa';

const AGENT_STEPS = [
  { label: 'Clinical Data Gathering', icon: Activity, color: 'text-blue-400' },
  { label: 'Policy Analysis', icon: FileText, color: 'text-violet-400' },
  { label: 'PA Packet Generation', icon: Bot, color: 'text-cyan-400' },
  { label: 'Compliance Validation', icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Finalizing Report', icon: Cpu, color: 'text-amber-400' },
];

function AgentProcessingOverlay({ paId, elapsed }: { paId: string; elapsed: number }) {
  const stepIdx = Math.min(4, elapsed < 3 ? 0 : elapsed < 6 ? 1 : elapsed < 10 ? 2 : elapsed < 14 ? 3 : 4);
  const progress = Math.min(95, (elapsed / 18) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 lg:pl-64"
      style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI Agents Running</h3>
            <p className="text-slate-400 text-sm font-mono">{paId}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold text-blue-400 tabular-nums">{elapsed}s</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">elapsed</p>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Agent Pipeline</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Agent steps */}
        <div className="space-y-3">
          {AGENT_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isDone = i < stepIdx;
            const isActive = i === stepIdx;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500',
                  isDone ? 'bg-emerald-500/20 border border-emerald-500/40' :
                  isActive ? 'bg-blue-500/20 border border-blue-500/40' :
                  'bg-slate-800 border border-slate-700'
                )}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <StepIcon className={cn('w-3.5 h-3.5', step.color)} />
                    </motion.div>
                  ) : (
                    <StepIcon className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-600'
                )}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map(d => (
                      <motion.div
                        key={d}
                        className="w-1 h-1 rounded-full bg-blue-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          You can navigate away — we&apos;ll track progress for you
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function PADetailView({ pa }: { pa: PARequest }) {
  const router = useRouter();
  const { startProcessing, finishProcessing, isProcessing, processingPAs } = useProcessing();
  const [actionLoading, setActionLoading] = useState<'approve' | 'deny' | 'process' | null>(null);
  const [processComplete, setProcessComplete] = useState(false);
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [streamingLog, setStreamingLog] = useState<ExecutionLogEntry[] | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // When this view mounts and the PA is already in-flight (user navigated away and back),
  // show the overlay automatically. When processing finishes, refresh.
  const isInFlight = isProcessing(pa.pa_id);
  const processingEntry = processingPAs.get(pa.pa_id);
  const overlayElapsed = processingEntry?.elapsed ?? 0;

  useEffect(() => {
    if (!isInFlight) return;
    // Poll for completion when overlay is showing
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [isInFlight, router]);

  const handleStreamingComplete = useCallback(() => {
    setStreamingLog(null);
    setActionLoading(null);
    setShowCelebration(true);
  }, []);

  const handleProcess = useCallback(async () => {
    setActionLoading('process');
    startProcessing(pa.pa_id);
    try {
      const result = await processPA(pa.pa_id, {
        patient_id: pa.patient_id,
        procedure_code: pa.procedure_code,
        diagnosis_codes: pa.diagnosis_codes,
        urgency: pa.urgency,
        payer: pa.payer,
      });

      finishProcessing(pa.pa_id);
      setActionLoading(null);

      if (!result.success) {
        if (result.execution_log && result.execution_log.length > 0) {
          setStreamingLog(result.execution_log as ExecutionLogEntry[]);
        } else {
          router.refresh();
        }
        return;
      }

      if (result.execution_log && result.execution_log.length > 0) {
        setStreamingLog(result.execution_log as ExecutionLogEntry[]);
      } else {
        setProcessComplete(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        router.refresh();
        setTimeout(() => setProcessComplete(false), 1500);
      }
    } catch {
      finishProcessing(pa.pa_id);
      router.refresh();
      setActionLoading(null);
    }
  }, [pa, router, startProcessing, finishProcessing]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await approvePARequest(pa.pa_id);
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      setShowDenyInput(true);
      return;
    }
    setActionLoading('deny');
    try {
      await denyPARequest(pa.pa_id, denyReason);
      router.refresh();
    } finally {
      setActionLoading(null);
      setShowDenyInput(false);
      setDenyReason('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 sm:p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {pa.pa_id}
              </h1>
              <StatusBadge status={pa.status} size="lg" />
              {pa.urgency === 'expedited' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  <Zap className="w-3 h-3" />
                  EXPEDITED
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Created {formatDistanceToNow(new Date(pa.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {pa.payer}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                CPT {pa.procedure_code}
              </span>
              {pa.compliance_checks?.confidence_score !== undefined && (
                <span className="flex items-center gap-1.5 sm:hidden">
                  <ConfidenceRing score={pa.compliance_checks.confidence_score} size={24} />
                  <span className="text-xs font-semibold text-slate-600">
                    {Math.round(pa.compliance_checks.confidence_score * 100)}%
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {pa.compliance_checks?.confidence_score !== undefined && (
              <div className="text-center hidden sm:block">
                <ConfidenceRing score={pa.compliance_checks.confidence_score} size={56} />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Confidence</p>
              </div>
            )}

            {(pa.status === 'submitted' || pa.status === 'failed') && (
              <button
                onClick={handleProcess}
                disabled={actionLoading !== null}
                className={cn(
                  'inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl shadow-lg transition-all text-sm font-semibold disabled:opacity-50',
                  processComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-blue-500/25'
                )}
              >
                {actionLoading === 'process' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : processComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {actionLoading === 'process' ? 'Processing...' : processComplete ? 'Complete!' : pa.status === 'failed' ? 'Retry Agents' : 'Run AI Agents'}
              </button>
            )}

            {(pa.status === 'hitl_required' || pa.status === 'ready_for_review') && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === 'approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Approve'
                    )}
                  </button>
                  <button
                    onClick={handleDeny}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'deny' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Deny'
                    )}
                  </button>
                </div>
                {showDenyInput && (
                  <div className="flex gap-2 w-full max-w-xs">
                    <input
                      type="text"
                      value={denyReason}
                      onChange={e => setDenyReason(e.target.value)}
                      placeholder="Denial reason..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                      autoFocus
                    />
                    <button
                      onClick={handleDeny}
                      disabled={!denyReason.trim()}
                      className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis codes & notes */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Diagnosis Codes
              </p>
              <div className="flex gap-1.5">
                {pa.diagnosis_codes.map(code => (
                  <span key={code} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                    {code}
                  </span>
                ))}
              </div>
            </div>
            {pa.clinician_id && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Clinician
                </p>
                <p className="text-sm text-slate-700 font-medium">{pa.clinician_id}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Last Updated
              </p>
              <p className="text-sm text-slate-700">
                {format(new Date(pa.updated_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          </div>
          {pa.notes && (
            <div className="mt-3 flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-500 italic">{pa.notes}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Clinical data */}
        <div className="lg:col-span-2 space-y-6">
          <PatientInfo clinicalData={pa.clinical_data} />
          <ClinicalDataPanel clinicalData={pa.clinical_data} />
          <PolicyAnalysisPanel
            policyAnalysis={pa.policy_analysis}
            complianceChecks={pa.compliance_checks}
          />
          <PAPacketPanel paPacket={pa.pa_packet} />
        </div>

        {/* Right column - Agent timeline */}
        <div className="space-y-6">
          <AgentTimeline
            executionLog={streamingLog || pa.execution_log}
            streaming={streamingLog !== null}
            onStreamingComplete={handleStreamingComplete}
          />

          {/* Complexity score */}
          {pa.clinical_data?.complexity_score !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Case Complexity</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pa.clinical_data.complexity_score * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {Math.round(pa.clinical_data.complexity_score * 100)}%
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Completion Celebration Overlay */}
      {showCelebration && (
        <CompletionCelebration
          confidenceScore={pa.compliance_checks?.confidence_score ?? 0.85}
          onDismiss={() => {
            setShowCelebration(false);
            setProcessComplete(true);
            router.refresh();
            setTimeout(() => setProcessComplete(false), 1500);
          }}
        />
      )}

      {/* Agent Processing Overlay — shown when user returns to an in-flight PA */}
      <AnimatePresence>
        {(isInFlight || actionLoading === 'process') && (
          <AgentProcessingOverlay
            paId={pa.pa_id}
            elapsed={overlayElapsed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
