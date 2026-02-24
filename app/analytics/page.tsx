import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

async function getAnalytics() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/analytics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  } catch {
    // Fallback: compute directly from demo data
    const { getDemoMetrics, DEMO_PA_REQUESTS, MOCK_PROCESSING_TIMELINE, MOCK_AGENT_PERFORMANCE } = await import('@/mock');
    const metrics = getDemoMetrics();
    const requests = DEMO_PA_REQUESTS;

    const payerBreakdown = requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.payer] = (acc[r.payer] || 0) + 1;
      return acc;
    }, {});

    return {
      total: metrics.total,
      avg_confidence: metrics.avg_confidence,
      avg_processing_time_hours: metrics.avg_processing_time_hours,
      approval_rate: Math.round((metrics.approved / metrics.total) * 100),
      status_breakdown: [
        { status: 'submitted', count: metrics.submitted },
        { status: 'processing', count: metrics.processing },
        { status: 'ready_for_review', count: metrics.ready_for_review },
        { status: 'hitl_required', count: metrics.hitl_required },
        { status: 'approved', count: metrics.approved },
        { status: 'denied', count: metrics.denied },
      ],
      payer_breakdown: Object.entries(payerBreakdown).map(([payer, count]) => ({ payer, count })),
      urgency_breakdown: [
        { urgency: 'standard', count: requests.filter((r: { urgency: string }) => r.urgency === 'standard').length },
        { urgency: 'expedited', count: requests.filter((r: { urgency: string }) => r.urgency === 'expedited').length },
      ],
      processing_timeline: MOCK_PROCESSING_TIMELINE,
      agent_performance: MOCK_AGENT_PERFORMANCE,
      data_source: 'demo',
    };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  return <AnalyticsDashboard data={data} />;
}
