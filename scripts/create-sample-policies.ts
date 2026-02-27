import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* .env may not exist */ }

const es = new Client({
  cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID! },
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY! },
});

// Import policies from the centralized mock data
// Note: We can't use @/ aliases in scripts run via tsx, so we use relative paths
import { SAMPLE_POLICIES } from '../mock/policies/sample-policies';

async function main() {
  for (const policy of SAMPLE_POLICIES) {
    await es.index({
      index: 'healthsync-policies',
      id: policy.policy_id,
      document: policy,
    });
    console.log(`Indexed policy: ${policy.policy_name}`);
  }
  console.log(`\nIndexed ${SAMPLE_POLICIES.length} policies`);
}

main();
