import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAgentPipeline } from '@/actions/pa-actions';

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

    const { pa_id, ...paData } = parsed.data;
    const result = await executeAgentPipeline(pa_id, paData);

    return NextResponse.json({ pa_id, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
