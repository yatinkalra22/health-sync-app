'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Target,
  Zap,
  Database,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AnalyticsData {
  total: number;
  avg_confidence: number;
  avg_processing_time_hours: number;
  approval_rate: number;
  status_breakdown: Array<{ status: string; count: number }>;
  payer_breakdown: Array<{ payer: string; count: number }>;
  urgency_breakdown: Array<{ urgency: string; count: number }>;
  processing_timeline: Array<{ day: string; submitted: number; processed: number }>;
  agent_performance: Array<{ agent: string; avg_duration_ms: number; success_rate: number }>;
  data_source: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#6366f1',
  processing: '#f59e0b',
  ready_for_review: '#10b981',
  hitl_required: '#ef4444',
  approved: '#3b82f6',
  denied: '#6b7280',
};

const PAYER_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  processing: 'Processing',
  ready_for_review: 'Ready for Review',
  hitl_required: 'HITL Required',
  approved: 'Approved',
  denied: 'Denied',
};

function ESQLBadge({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <Database className="w-3 h-3" />
        ES|QL
        <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="mt-2 text-[11px] leading-relaxed font-mono bg-slate-900 text-emerald-400 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre">
              {query}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalyticsDashboard({ data: rawData }: { data: AnalyticsData }) {
  // Defensive defaults to prevent "Cannot read properties of undefined" crashes
  const data: AnalyticsData = {
    total: rawData?.total ?? 0,
    avg_confidence: rawData?.avg_confidence ?? 0,
    avg_processing_time_hours: rawData?.avg_processing_time_hours ?? 0,
    approval_rate: rawData?.approval_rate ?? 0,
    status_breakdown: rawData?.status_breakdown ?? [],
    payer_breakdown: rawData?.payer_breakdown ?? [],
    urgency_breakdown: rawData?.urgency_breakdown ?? [],
    processing_timeline: rawData?.processing_timeline ?? [],
    agent_performance: rawData?.agent_performance ?? [],
    data_source: rawData?.data_source ?? 'unknown',
  };
  const kpis = [
    {
      label: 'Total PA Requests',
      value: data.total,
      icon: Database,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: 'Approval Rate',
      value: `${data.approval_rate}%`,
      icon: Target,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Avg Confidence',
      value: `${data.avg_confidence}%`,
      icon: TrendingUp,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Avg Processing Time',
      value: `${data.avg_processing_time_hours}h`,
      icon: Clock,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
          PA workflow performance metrics
          {data.data_source === 'elasticsearch' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-semibold">
              <Zap className="w-3 h-3" /> ES|QL Powered
            </span>
          )}
          {data.data_source === 'demo' && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold">
              Demo Data
            </span>
          )}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-5"
          >
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">PA Status Distribution</h3>
            <ESQLBadge query={`FROM healthsync-pa-requests\n| STATS count = COUNT(*) BY status\n| SORT count DESC`} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.status_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => (STATUS_LABELS[v] || v).slice(0, 8)}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v) => STATUS_LABELS[v as string] || v}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.status_breakdown.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payer Breakdown - Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Requests by Payer</h3>
            <ESQLBadge query={`FROM healthsync-pa-requests\n| STATS count = COUNT(*) BY payer\n| SORT count DESC`} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.payer_breakdown}
                dataKey="count"
                nameKey="payer"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }: { name?: string; percent?: number }) => `${(name || '').slice(0, 10)} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {data.payer_breakdown.map((_, i) => (
                  <Cell key={i} fill={PAYER_COLORS[i % PAYER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Timeline - Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Weekly Processing Volume</h3>
            <ESQLBadge query={`FROM healthsync-pa-requests\n| WHERE created_at >= NOW() - 7 days\n| EVAL day = DATE_FORMAT(created_at, "EEE")\n| STATS submitted = COUNT(*) BY day`} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.processing_timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="submitted"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Submitted"
              />
              <Line
                type="monotone"
                dataKey="processed"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Processed"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Agent Performance - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Agent Performance</h3>
            <ESQLBadge query={`FROM healthsync-audit-logs\n| STATS avg_duration = AVG(duration_ms),\n       success_rate = COUNT(status == "completed") / COUNT(*) * 100\n  BY agent`} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.agent_performance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="agent"
                tick={{ fontSize: 9 }}
                width={110}
                tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value?: number, name?: string) =>
                  name === 'avg_duration_ms' ? [`${value}ms`, 'Avg Duration'] : [`${value}%`, 'Success Rate']
                }
              />
              <Legend />
              <Bar dataKey="avg_duration_ms" fill="#6366f1" name="Avg Duration (ms)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-3">
            {data.agent_performance.map((agent) => (
              <span key={agent.agent} className="text-[10px] text-slate-500">
                {agent.agent}: <span className="font-semibold text-emerald-600">{agent.success_rate}%</span> success
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
