'use server';

import { CoordinatorAgent } from '@/lib/agents/CoordinatorAgent';
import { elasticsearch } from '@/lib/services/elasticsearch';
import { revalidatePath } from 'next/cache';

export async function triggerAgentProcessing(paId: string, paData: {
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  urgency: string;
  payer: string;
}) {
  try {
    const coordinator = new CoordinatorAgent(elasticsearch);
    const result = await coordinator.execute({
      pa_id: paId,
      ...paData,
    });

    revalidatePath('/');
    revalidatePath(`/pa/${paId}`);

    return {
      success: true,
      status: result.status,
      execution_log: result.execution_log,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
