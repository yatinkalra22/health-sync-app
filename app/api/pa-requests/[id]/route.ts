import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPARequest, elasticsearch, updatePARequest } from '@/lib/services/elasticsearch';
import { DEMO_PA_REQUESTS } from '@/lib/demo-data';
import { PA_STATUSES } from '@/lib/constants';

const patchPASchema = z.object({
  status: z.enum(PA_STATUSES).optional(),
  notes: z.string().optional(),
  clinical_data: z.record(z.string(), z.unknown()).optional(),
  policy_analysis: z.record(z.string(), z.unknown()).optional(),
}).strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use demo data when Elasticsearch is not configured
    if (!elasticsearch) {
      const demoPA = DEMO_PA_REQUESTS.find(pa => pa.pa_id === id);
      if (!demoPA) {
        return NextResponse.json({ error: 'PA request not found' }, { status: 404 });
      }
      return NextResponse.json(demoPA);
    }

    const pa = await getPARequest(id);
    if (!pa) {
      return NextResponse.json({ error: 'PA request not found' }, { status: 404 });
    }

    return NextResponse.json(pa);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchPASchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await updatePARequest(id, {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, pa_id: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
