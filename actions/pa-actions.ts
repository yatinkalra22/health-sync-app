'use server';

import { revalidatePath } from 'next/cache';
import { indexPARequest, updatePARequest } from '@/lib/services/elasticsearch';

export async function createPARequest(formData: FormData) {
  const paId = `PA-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

  const diagnosisCodesRaw = formData.get('diagnosis_codes') as string;
  const diagnosisCodes = diagnosisCodesRaw
    ? diagnosisCodesRaw.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const paRequest = {
    pa_id: paId,
    patient_id: formData.get('patient_id') as string,
    procedure_code: formData.get('procedure_code') as string,
    diagnosis_codes: diagnosisCodes,
    urgency: (formData.get('urgency') as string) || 'standard',
    payer: (formData.get('payer') as string) || 'Medicare',
    clinician_id: formData.get('clinician_id') as string,
    notes: formData.get('notes') as string,
    status: 'submitted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await indexPARequest(paRequest);

  revalidatePath('/');
  return paId;
}

export async function approvePARequest(paId: string) {
  await updatePARequest(paId, {
    status: 'approved',
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/');
  revalidatePath(`/pa/${paId}`);
  return { success: true };
}

export async function denyPARequest(paId: string, reason: string) {
  await updatePARequest(paId, {
    status: 'denied',
    denial_reason: reason,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/');
  revalidatePath(`/pa/${paId}`);
  return { success: true };
}
