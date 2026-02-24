import { NextResponse } from 'next/server';
import { elasticsearch, getAnalyticsWithESQL } from '@/lib/services/elasticsearch';
import { getAllDemoPARequests, MOCK_PROCESSING_TIMELINE, MOCK_AGENT_PERFORMANCE } from '@/mock';

export async function GET() {
  try {
    if (!elasticsearch) {
      // Demo mode analytics - computed from live demo store
      const requests = getAllDemoPARequests();
      const total = requests.length;
      const approved = requests.filter(r => r.status === 'approved').length;

      const statusBreakdown = [
        { status: 'submitted', count: requests.filter(r => r.status === 'submitted').length },
        { status: 'processing', count: requests.filter(r => r.status === 'processing').length },
        { status: 'ready_for_review', count: requests.filter(r => r.status === 'ready_for_review').length },
        { status: 'hitl_required', count: requests.filter(r => r.status === 'hitl_required').length },
        { status: 'approved', count: approved },
        { status: 'denied', count: requests.filter(r => r.status === 'denied').length },
      ];

      const payerBreakdown = requests.reduce<Record<string, number>>((acc, r) => {
        acc[r.payer] = (acc[r.payer] || 0) + 1;
        return acc;
      }, {});

      const urgencyBreakdown = requests.reduce<Record<string, number>>((acc, r) => {
        acc[r.urgency] = (acc[r.urgency] || 0) + 1;
        return acc;
      }, {});

      const avgConfidence = Math.round(
        (requests
          .filter(r => r.compliance_checks?.confidence_score)
          .reduce((sum, r) => sum + (r.compliance_checks?.confidence_score || 0), 0) /
          (requests.filter(r => r.compliance_checks?.confidence_score).length || 1)) * 100
      );

      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      const processingTimeline = MOCK_PROCESSING_TIMELINE;
      const agentPerformance = MOCK_AGENT_PERFORMANCE;

      return NextResponse.json({
        total,
        avg_confidence: avgConfidence,
        avg_processing_time_hours: 4.2,
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
