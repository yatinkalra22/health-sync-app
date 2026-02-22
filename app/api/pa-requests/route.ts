import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { elasticsearch, searchPARequests, indexPARequest } from '@/lib/services/elasticsearch';
import { CoordinatorAgent } from '@/lib/agents/CoordinatorAgent';
import { getAllDemoPARequests, addDemoPARequest, updateDemoPARequest } from '@/lib/demo-store';
import { runDemoAgentPipeline } from '@/lib/agents/demo-agent-runner';
import { PA_STATUSES, API_DEFAULT_PAGE_SIZE, API_MAX_PAGE_SIZE, ES_INDICES } from '@/lib/constants';
import type { PARequest } from '@/lib/types/pa';

const createPASchema = z.object({
  patient_id: z.string().min(1),
  procedure_code: z.string().min(1),
  diagnosis_codes: z.array(z.string().min(1)).min(1),
  urgency: z.enum(['standard', 'expedited']).default('standard'),
  payer: z.string().min(1).default('Medicare'),
  clinician_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    if (status && !PA_STATUSES.includes(status as typeof PA_STATUSES[number])) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(API_DEFAULT_PAGE_SIZE)),
      API_MAX_PAGE_SIZE
    );

    if (!elasticsearch) {
      const data = getAllDemoPARequests({ status: status || undefined, limit });
      return NextResponse.json(data);
    }

    const filters: { status?: string; limit: number } = { limit };
    if (status) filters.status = status;

    const paRequests = await searchPARequests(filters);
    return NextResponse.json(paRequests);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPASchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const paId = `PA-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const validated = parsed.data;
    const paRequest: PARequest = {
      pa_id: paId,
      patient_id: validated.patient_id,
      procedure_code: validated.procedure_code,
      diagnosis_codes: validated.diagnosis_codes,
      urgency: validated.urgency,
      payer: validated.payer,
      clinician_id: validated.clinician_id,
      notes: validated.notes,
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!elasticsearch) {
      // Demo mode: add to in-memory store and run demo agents
      addDemoPARequest(paRequest);

      // Run demo agent pipeline
      const result = runDemoAgentPipeline(paRequest);
      updateDemoPARequest(paId, {
        status: result.final_status as PARequest['status'],
        clinical_data: result.clinical_data,
        policy_analysis: result.policy_analysis,
        pa_packet: result.pa_packet,
        compliance_checks: result.compliance_checks,
        execution_log: result.execution_log,
      });

      return NextResponse.json({ ...paRequest, status: result.final_status }, { status: 201 });
    }

    await indexPARequest(paRequest);
    processPARequest(paId, paRequest).catch(console.error);

    return NextResponse.json(paRequest, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processPARequest(paId: string, paRequest: PARequest) {
  try {
    if (elasticsearch) {
      await elasticsearch.update({
        index: ES_INDICES.PA_REQUESTS,
        id: paId,
        doc: { status: 'processing', updated_at: new Date().toISOString() },
      });
    }

    const coordinator = new CoordinatorAgent(elasticsearch);
    const result = await coordinator.execute({
      pa_id: paId,
      patient_id: paRequest.patient_id,
      procedure_code: paRequest.procedure_code,
      diagnosis_codes: paRequest.diagnosis_codes,
      urgency: paRequest.urgency,
      payer: paRequest.payer,
    });

    if (elasticsearch) {
      await elasticsearch.update({
        index: ES_INDICES.PA_REQUESTS,
        id: paId,
        doc: {
          status: result.status,
          clinical_data: result.clinical_data,
          policy_analysis: result.policy_analysis,
          pa_packet: result.pa_packet,
          compliance_checks: result.compliance_checks,
          execution_log: result.execution_log,
          updated_at: new Date().toISOString(),
        },
      });
    }

    console.log(`PA ${paId} processed successfully`);
  } catch (error) {
    console.error(`PA ${paId} processing failed:`, error);
  }
}
