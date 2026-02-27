import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkElasticsearch() {
  if (!process.env.ELASTICSEARCH_CLOUD_ID || !process.env.ELASTICSEARCH_API_KEY) {
    console.log('  Elasticsearch: NOT CONFIGURED (will use demo mode)');
    return false;
  }

  try {
    const es = new Client({
      cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID },
      auth: { apiKey: process.env.ELASTICSEARCH_API_KEY },
    });
    const info = await es.info();
    console.log(`  Elasticsearch: CONNECTED (v${info.version.number})`);

    const indices = [
      'healthsync-patients',
      'healthsync-conditions',
      'healthsync-medications',
      'healthsync-pa-requests',
      'healthsync-policies',
    ];

    for (const index of indices) {
      try {
        const count = await es.count({ index });
        console.log(`    ${index}: ${count.count} documents`);
      } catch {
        console.log(`    ${index}: NOT FOUND`);
      }
    }

    return true;
  } catch {
    console.log('  Elasticsearch: DISCONNECTED');
    return false;
  }
}

async function checkFHIRServer() {
  try {
    const response = await fetch('http://localhost:8080/fhir/metadata', {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      console.log('  FHIR Server: RUNNING');
      return true;
    }
    console.log('  FHIR Server: ERROR');
    return false;
  } catch {
    console.log('  FHIR Server: NOT RUNNING');
    return false;
  }
}

function checkGeminiAPI() {
  if (process.env.GEMINI_API_KEY) {
    console.log('  Gemini API: CONFIGURED');
    return true;
  }
  console.log('  Gemini API: NOT CONFIGURED (will use demo mode)');
  return false;
}

async function main() {
  console.log('========================================');
  console.log('  HealthSync APP System Health Check');
  console.log('========================================\n');

  console.log('Services:');
  await checkElasticsearch();
  await checkFHIRServer();
  checkGeminiAPI();

  console.log('\n========================================');
  console.log('  Health check complete!');
  console.log('========================================');
}

main();
