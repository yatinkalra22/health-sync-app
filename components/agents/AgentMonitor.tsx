'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2, Clock, Zap, ChevronDown, Database, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PARequest } from '@/lib/types/pa';

const AGENTS = [
  {
    name: 'CoordinatorAgent',
    role: 'Orchestrator',
    description: 'Orchestrates the full PA pipeline, manages state transitions, and writes audit logs for every PHI access',
    color: 'blue',
    esql: null,
  },
  {
    name: 'ClinicalDataGatherer',
    role: 'Data Agent',
    description: 'Queries FHIR patient data from Elasticsearch using ES|QL aggregations across conditions, medications, procedures, and observations',
    color: 'emerald',
    esql: 'FROM healthsync-conditions\n| WHERE patient_id == "{patient_id}"\n| STATS total_conditions = COUNT(*),\n       active = COUNT_DISTINCT(clinicalStatus)',
  },
  {
    name: 'PolicyAnalyzer',
    role: 'Search Agent',
    description: 'Runs ES|QL policy stats and hybrid search to match payer coverage criteria against clinical findings',
    color: 'indigo',
    esql: 'FROM healthsync-policies\n| WHERE payer == "{payer}"\n| STATS total_policies = COUNT(*),\n       procedure_count = COUNT_DISTINCT(procedure_codes)',
  },
  {
    name: 'DocumentationAssembler',
    role: 'Generation Agent',
    description: 'Generates structured PA packets with medical necessity narratives and assembles supporting evidence',
    color: 'purple',
    esql: null,
  },
  {
    name: 'ComplianceValidator',
    role: 'Validation Agent',
    description: 'Validates CMS timeline compliance (72h expedited / 7-day standard), documentation completeness, and calculates confidence scores',
    color: 'amber',
    esql: 'FROM healthsync-pa-requests\n| WHERE pa_id == "{pa_id}"\n| STATS compliance_score = AVG(compliance_score)',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string; badge: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
};

function getAgentStats(agentName: string, paRequests: PARequest[]) {
  let completed = 0;
  let failed = 0;
  let inProgress = 0;

  for (const pa of paRequests) {
    if (!pa.execution_log) continue;
    for (const entry of pa.execution_log) {
      if (entry.agent === agentName) {
        if (entry.status === 'completed') completed++;
        else if (entry.status === 'failed') failed++;
        else if (entry.status === 'started') inProgress++;
      }
    }
  }

  return { completed, failed, inProgress, total: completed + failed + inProgress };
}

export default function AgentMonitor({ paRequests }: { paRequests: PARequest[] }) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const totalProcessed = paRequests.filter(r => r.execution_log && r.execution_log.length > 0).length;
  const avgSteps = paRequests
    .filter(r => r.execution_log && r.execution_log.length > 0)
    .reduce((sum, r) => sum + (r.execution_log?.length || 0), 0) / (totalProcessed || 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Bot className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Monitor</h1>
        </div>
        <p className="text-sm text-slate-500">
          Real-time status of the 5-agent PA processing pipeline
        </p>
      </motion.div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">5</div>
          <p className="text-xs text-slate-500">Active Agents</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600">{totalProcessed}</div>
          <p className="text-xs text-slate-500">PAs Processed</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-600">{avgSteps.toFixed(1)}</div>
          <p className="text-xs text-slate-500">Avg Steps/PA</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-600">All Healthy</span>
          </div>
          <p className="text-xs text-slate-500">System Status</p>
        </motion.div>
      </div>

      {/* Agent cards */}
      <div className="space-y-3">
        {AGENTS.map((agent, i) => {
          const stats = getAgentStats(agent.name, paRequests);
          const colors = COLOR_MAP[agent.color];
          const isExpanded = expandedAgent === agent.name;

          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Status dot + icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
                    <Bot className={cn('w-5 h-5', colors.text)} />
                  </div>

                  {/* Name & description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">{agent.name}</h3>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', colors.badge)}>
                        {agent.role}
                      </span>
                      {agent.esql && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                          ES|QL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{agent.description}</p>
                  </div>

                  {/* Stats - compact on mobile, full on desktop */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-600">{stats.completed}</div>
                      <div className="text-[10px] text-slate-400">Done</div>
                    </div>
                    {stats.inProgress > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-600">{stats.inProgress}</div>
                        <div className="text-[10px] text-slate-400">Active</div>
                      </div>
                    )}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className={cn('w-2 h-2 rounded-full', colors.dot, stats.inProgress > 0 && 'animate-pulse')} />
                      <span className="text-xs text-slate-500">Ready</span>
                    </div>
                  </div>

                  <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Stats detail */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Performance</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                              </span>
                              <span className="text-xs font-semibold text-slate-700">{stats.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-blue-500" /> In Progress
                              </span>
                              <span className="text-xs font-semibold text-slate-700">{stats.inProgress}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400" /> Total Invocations
                              </span>
                              <span className="text-xs font-semibold text-slate-700">{stats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-amber-500" /> Success Rate
                              </span>
                              <span className="text-xs font-semibold text-emerald-600">
                                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ES|QL query if applicable */}
                        {agent.esql && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Database className="w-3 h-3" /> ES|QL Query Template
                            </h4>
                            <pre className="text-[11px] leading-relaxed font-mono bg-slate-900 text-emerald-400 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
                              {agent.esql}
                            </pre>
                          </div>
                        )}

                        {!agent.esql && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Capabilities</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{agent.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
