'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Eye, Bot, Clock, Database, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface AuditLog {
  audit_id: string;
  timestamp: string;
  action: string;
  agent: string;
  pa_id: string;
  patient_id?: string;
  details: string;
  phi_accessed: boolean;
  duration_ms?: number;
  esql_query?: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof Shield; color: string; bg: string; label: string }> = {
  workflow_started: { icon: Bot, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Workflow Started' },
  clinical_data_accessed: { icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50', label: 'PHI Accessed' },
  policy_analyzed: { icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Policy Analyzed' },
  pa_packet_generated: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', label: 'PA Packet Generated' },
  compliance_validated: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Compliance Validated' },
  workflow_completed: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Workflow Complete' },
  pa_approved: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'PA Approved' },
  pa_denied: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', label: 'PA Denied' },
};

function AuditRow({ log, index }: { log: AuditLog; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTION_CONFIG[log.action] || { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50', label: log.action };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left hover:bg-slate-50/80 transition-colors rounded-lg p-3"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{config.label}</span>
              {log.phi_accessed && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">
                  PHI
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">
                {log.agent}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{log.details}</p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
              {log.pa_id}
            </span>
            {log.duration_ms && (
              <span className="text-[10px] text-slate-400 hidden md:block">
                {log.duration_ms}ms
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              {format(new Date(log.timestamp), 'HH:mm:ss')}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden px-3 pb-3"
        >
          <div className="ml-0 sm:ml-11 bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Audit ID:</span>{' '}
                <span className="font-mono text-slate-600">{log.audit_id}</span>
              </div>
              <div>
                <span className="text-slate-400">Timestamp:</span>{' '}
                <span className="text-slate-600">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</span>
              </div>
              <div>
                <span className="text-slate-400">PA Request:</span>{' '}
                <span className="font-mono text-slate-600">{log.pa_id}</span>
              </div>
              {log.patient_id && (
                <div>
                  <span className="text-slate-400">Patient ID:</span>{' '}
                  <span className="font-mono text-slate-600">{log.patient_id}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400">Agent:</span>{' '}
                <span className="font-mono text-slate-600">{log.agent}</span>
              </div>
              {log.duration_ms && (
                <div>
                  <span className="text-slate-400">Duration:</span>{' '}
                  <span className="text-slate-600">{log.duration_ms}ms</span>
                </div>
              )}
            </div>
            {log.phi_accessed && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded px-2 py-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Protected Health Information (PHI) was accessed during this operation</span>
              </div>
            )}
            {log.esql_query && (
              <div>
                <span className="text-slate-400 block mb-1">ES|QL Query:</span>
                <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
                  {log.esql_query}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = useState<'all' | 'phi'>('all');

  const filteredLogs = filter === 'phi' ? logs.filter(l => l.phi_accessed) : logs;
  const phiCount = logs.filter(l => l.phi_accessed).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        </div>
        <p className="text-sm text-slate-500">
          HIPAA-compliant audit trail — every agent action and PHI access is logged
        </p>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
          <p className="text-xs text-slate-500">Total Events</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-600">{phiCount}</div>
          <p className="text-xs text-slate-500">PHI Access Events</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(logs.map(l => l.agent)).size}
          </div>
          <p className="text-xs text-slate-500">Unique Agents</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600">
            {new Set(logs.map(l => l.pa_id)).size}
          </div>
          <p className="text-xs text-slate-500">PA Requests</p>
        </motion.div>
      </div>

      {/* Filter & Log list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              All Events ({logs.length})
            </button>
            <button
              onClick={() => setFilter('phi')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'phi' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              PHI Only ({phiCount})
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            Most recent first
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredLogs.map((log, i) => (
            <AuditRow key={log.audit_id} log={log} index={i} />
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No audit events found
          </div>
        )}
      </motion.div>
    </div>
  );
}
