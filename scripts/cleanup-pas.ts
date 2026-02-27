import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (process.env[key] === undefined) process.env[key] = value;
}

const es = new Client({
  cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID as string },
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY as string },
});

async function main() {
  const r = await es.deleteByQuery({ index: 'healthsync-pa-requests', query: { match_all: {} } });
  console.log('Deleted', r.deleted, 'old PA requests');
}

main();
