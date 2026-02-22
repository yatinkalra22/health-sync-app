'use client';

import { cn } from '@/lib/utils/cn';

export default function ConfidenceRing({ score, size = 48 }: { score: number; size?: number }) {
  const percentage = Math.round(score * 100);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const colorClass = percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500';
  const bgColorClass = percentage >= 80 ? 'text-emerald-100' : percentage >= 50 ? 'text-amber-100' : 'text-rose-100';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={cn('stroke-current', bgColorClass)}
          strokeWidth={3}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('stroke-current transition-all duration-1000 ease-out', colorClass)}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', colorClass)}>
        {percentage}%
      </span>
    </div>
  );
}
