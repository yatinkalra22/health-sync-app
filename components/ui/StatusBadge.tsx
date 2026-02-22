'use client';

import { cn } from '@/lib/utils/cn';
import type { PAStatus } from '@/lib/types/pa';

const statusConfig: Record<PAStatus, { label: string; className: string; dotClass: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  processing: {
    label: 'Processing',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-400 animate-pulse',
  },
  ready_for_review: {
    label: 'Ready for Review',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-400',
  },
  hitl_required: {
    label: 'Review Required',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-400 animate-pulse',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-400',
  },
  denied: {
    label: 'Denied',
    className: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClass: 'bg-gray-400',
  },
};

export default function StatusBadge({ status, size = 'md' }: { status: PAStatus; size?: 'sm' | 'md' | 'lg' }) {
  const config = statusConfig[status] || statusConfig.submitted;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-sm px-4 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold border', config.className, sizeClass)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
