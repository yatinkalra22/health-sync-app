'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  XCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PARequest } from '@/lib/types/pa';

interface MetricsSummaryProps {
  paRequests: PARequest[];
}

export default function MetricsSummary({ paRequests }: MetricsSummaryProps) {
  const metrics = [
    {
      label: 'Total Requests',
      value: paRequests.length,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Processing',
      value: paRequests.filter(p => p.status === 'processing' || p.status === 'submitted').length,
      icon: Loader2,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      animate: true,
    },
    {
      label: 'Ready for Review',
      value: paRequests.filter(p => p.status === 'ready_for_review').length,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Needs Attention',
      value: paRequests.filter(p => p.status === 'hitl_required').length,
      icon: AlertTriangle,
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
    },
    {
      label: 'Approved',
      value: paRequests.filter(p => p.status === 'approved').length,
      icon: ThumbsUp,
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      label: 'Denied',
      value: paRequests.filter(p => p.status === 'denied').length,
      icon: XCircle,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
    },
    {
      label: 'Avg Confidence',
      value: Math.round(
        (paRequests
          .filter(p => p.compliance_checks?.confidence_score)
          .reduce((sum, p) => sum + (p.compliance_checks?.confidence_score || 0), 0) /
          (paRequests.filter(p => p.compliance_checks?.confidence_score).length || 1)) * 100
      ),
      suffix: '%',
      icon: TrendingUp,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
    },
    {
      label: 'Avg Time',
      value: '4.2',
      suffix: 'hrs',
      icon: Clock,
      color: 'from-purple-500 to-fuchsia-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className="glass-card rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', metric.bgColor)}>
              <metric.icon className={cn('w-5 h-5', metric.textColor, metric.animate && 'animate-spin')} />
            </div>
          </div>
          <div className={cn('text-2xl font-bold', metric.textColor)}>
            {metric.value}{metric.suffix || ''}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{metric.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
