import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CoordinatorAgent } from '@/lib/agents/CoordinatorAgent';
import { elasticsearch, updatePARequest } from '@/lib/services/elasticsearch';
import { ES_INDICES } from '@/lib/constants';

const executeSchema = z.object({
  pa_id: z.string().min(1),
  patient_id: z.string().min(1),
  procedure_code: z.string().min(1),
  diagnosis_codes: z.array(z.string().min(1)).min(1),
  urgency: z.enum(['standard', 'expedited']).default('standard'),
  payer: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = executeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pa_id } = parsed.data;

    // Update status to processing
    if (elasticsearch) {
      await elasticsearch.update({
        index: ES_INDICES.PA_REQUESTS,
        id: pa_id,
        doc: { status: 'processing', updated_at: new Date().toISOString() },
      });
    }

    // Execute coordinator agent
    const coordinator = new CoordinatorAgent(elasticsearch);
    const result = await coordinator.execute(parsed.data);

    // Update PA with results
    if (elasticsearch) {
      await updatePARequest(pa_id, {
        status: result.status,
        clinical_data: result.clinical_data,
        policy_analysis: result.policy_analysis,
        pa_packet: result.pa_packet,
        compliance_checks: result.compliance_checks,
        execution_log: result.execution_log,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      pa_id,
      status: result.status,
      execution_log: result.execution_log,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
