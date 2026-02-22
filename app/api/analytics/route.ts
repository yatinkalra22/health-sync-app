import { NextResponse } from 'next/server';
import { elasticsearch, getAnalyticsWithESQL } from '@/lib/services/elasticsearch';
import { DEMO_PA_REQUESTS, getDemoMetrics } from '@/lib/demo-data';

export async function GET() {
  try {
    if (!elasticsearch) {
      // Demo mode analytics
      const metrics = getDemoMetrics();
      const requests = DEMO_PA_REQUESTS;

      const statusBreakdown = [
        { status: 'submitted', count: metrics.submitted },
        { status: 'processing', count: metrics.processing },
        { status: 'ready_for_review', count: metrics.ready_for_review },
        { status: 'hitl_required', count: metrics.hitl_required },
        { status: 'approved', count: metrics.approved },
        { status: 'denied', count: metrics.denied },
      ];

      const payerBreakdown = requests.reduce<Record<string, number>>((acc, r) => {
        acc[r.payer] = (acc[r.payer] || 0) + 1;
        return acc;
      }, {});

      const urgencyBreakdown = requests.reduce<Record<string, number>>((acc, r) => {
        acc[r.urgency] = (acc[r.urgency] || 0) + 1;
        return acc;
      }, {});

      const approvalRate = metrics.total > 0
        ? Math.round((metrics.approved / metrics.total) * 100)
        : 0;

      const processingTimeline = [
        { day: 'Mon', submitted: 3, processed: 2 },
        { day: 'Tue', submitted: 5, processed: 4 },
        { day: 'Wed', submitted: 2, processed: 3 },
        { day: 'Thu', submitted: 4, processed: 3 },
        { day: 'Fri', submitted: 6, processed: 5 },
        { day: 'Sat', submitted: 1, processed: 2 },
        { day: 'Sun', submitted: 2, processed: 1 },
      ];

      const agentPerformance = [
        { agent: 'ClinicalDataGatherer', avg_duration_ms: 1200, success_rate: 98 },
        { agent: 'PolicyAnalyzer', avg_duration_ms: 2400, success_rate: 95 },
        { agent: 'DocumentationAssembler', avg_duration_ms: 3100, success_rate: 97 },
        { agent: 'ComplianceValidator', avg_duration_ms: 800, success_rate: 100 },
      ];

      return NextResponse.json({
        total: metrics.total,
        avg_confidence: metrics.avg_confidence,
        avg_processing_time_hours: metrics.avg_processing_time_hours,
        approval_rate: approvalRate,
        status_breakdown: statusBreakdown,
        payer_breakdown: Object.entries(payerBreakdown).map(([payer, count]) => ({ payer, count })),
        urgency_breakdown: Object.entries(urgencyBreakdown).map(([urgency, count]) => ({ urgency, count })),
        processing_timeline: processingTimeline,
        agent_performance: agentPerformance,
        data_source: 'demo',
      });
    }

    // Live mode with ES|QL
    const esqlData = await getAnalyticsWithESQL();

    return NextResponse.json({
      ...esqlData,
      data_source: 'elasticsearch',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
