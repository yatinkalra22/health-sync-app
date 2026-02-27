import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env
for (const envFile of ['.env.local', '.env']) {
  try {
    const content = readFileSync(resolve(process.cwd(), envFile), 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (t === '' || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch { /* skip */ }
}

const es = new Client({
  cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID! },
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY! },
});

async function main() {
  // Delete pa-requests index
  try {
    await es.indices.delete({ index: 'healthsync-pa-requests' });
    console.log('Deleted healthsync-pa-requests');
  } catch {
    console.log('Index did not exist, creating fresh');
  }

  // Recreate with complex objects disabled (no dynamic mapping conflicts)
  await es.indices.create({
    index: 'healthsync-pa-requests',
    mappings: {
      properties: {
        pa_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        request_type: { type: 'keyword' },
        urgency: { type: 'keyword' },
        procedure_code: { type: 'keyword' },
        diagnosis_codes: { type: 'keyword' },
        status: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        payer: { type: 'keyword' },
        clinician_id: { type: 'keyword' },
        notes: { type: 'text' },
        compliance_score: { type: 'float' },
        hitl_required: { type: 'boolean' },
        clinical_data: { type: 'object', enabled: false },
        policy_analysis: { type: 'object', enabled: false },
        pa_packet: { type: 'object', enabled: false },
        compliance_checks: { type: 'object', enabled: false },
        execution_log: { type: 'object', enabled: false },
      },
    },
  });
  console.log('Recreated healthsync-pa-requests with disabled nested mappings');
  console.log('All complex objects (clinical_data, policy_analysis, pa_packet, etc.) will be stored but not dynamically mapped.');
}

main().catch(console.error);
