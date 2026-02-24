'use server';

import { revalidatePath } from 'next/cache';
import { elasticsearch, indexPARequest, updatePARequest } from '@/lib/services/elasticsearch';
import { addDemoPARequest, updateDemoPARequest, runDemoAgentPipeline } from '@/mock';
import type { PARequest } from '@/lib/types/pa';

export async function createPARequest(formData: FormData) {
  const paId = `PA-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

  const diagnosisCodesRaw = formData.get('diagnosis_codes') as string;
  const diagnosisCodes = diagnosisCodesRaw
    ? diagnosisCodesRaw.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const paRequest: PARequest = {
    pa_id: paId,
    patient_id: formData.get('patient_id') as string,
    procedure_code: formData.get('procedure_code') as string,
    diagnosis_codes: diagnosisCodes,
    urgency: ((formData.get('urgency') as string) || 'standard') as PARequest['urgency'],
    payer: (formData.get('payer') as string) || 'Medicare',
    clinician_id: formData.get('clinician_id') as string,
    notes: formData.get('notes') as string,
    status: 'submitted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!elasticsearch) {
    addDemoPARequest(paRequest);
  } else {
    await indexPARequest(paRequest);
  }

  revalidatePath('/');
  return paId;
}

export async function approvePARequest(paId: string) {
  if (!elasticsearch) {
    updateDemoPARequest(paId, { status: 'approved' });
  } else {
    await updatePARequest(paId, {
      status: 'approved',
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath('/');
  revalidatePath(`/pa/${paId}`);
  return { success: true };
}

export async function denyPARequest(paId: string, reason: string) {
  if (!elasticsearch) {
    updateDemoPARequest(paId, { status: 'denied', notes: `Denied: ${reason}` });
  } else {
    await updatePARequest(paId, {
      status: 'denied',
      notes: `Denied: ${reason}`,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath('/');
  revalidatePath(`/pa/${paId}`);
  return { success: true };
}

export async function processPA(paId: string, paData: {
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  urgency: PARequest['urgency'];
  payer: string;
}) {
  if (!elasticsearch) {
    // Demo mode: run simulated agents
    updateDemoPARequest(paId, { status: 'processing' });

    const result = runDemoAgentPipeline({ pa_id: paId, ...paData });

    updateDemoPARequest(paId, {
      status: result.final_status as PARequest['status'],
      clinical_data: result.clinical_data,
      policy_analysis: result.policy_analysis,
      pa_packet: result.pa_packet,
      compliance_checks: result.compliance_checks,
      execution_log: result.execution_log,
    });

    revalidatePath('/');
    revalidatePath(`/pa/${paId}`);
    return {
      success: true,
      status: result.final_status,
      execution_log: result.execution_log,
    };
  }

  // Live mode: use real agents (handled by agent-actions.ts)
  revalidatePath('/');
  revalidatePath(`/pa/${paId}`);
  return { success: true };
}
