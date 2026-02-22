import { NextResponse } from 'next/server';
import { elasticsearch, getAnalyticsWithESQL } from '@/lib/services/elasticsearch';
import { getAllDemoPARequests } from '@/lib/demo-store';

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
