import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';

async function waitForServer(maxRetries = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${FHIR_SERVER_URL}/metadata`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        console.log('FHIR server is ready.\n');
        return;
      }
    } catch {
      // server not ready yet
    }
    console.log(`Waiting for FHIR server... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`FHIR server not available at ${FHIR_SERVER_URL}`);
}

async function loadBundle(filePath: string): Promise<{ total: number; errors: number }> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const bundle = JSON.parse(raw);

  if (bundle.resourceType !== 'Bundle') {
    console.log(`  Skipping ${path.basename(filePath)} - not a FHIR Bundle`);
    return { total: 0, errors: 0 };
  }

  const entries = bundle.entry || [];
  console.log(`  Loading ${path.basename(filePath)} (${entries.length} resources)...`);

  // POST the entire bundle as a transaction/batch
  const res = await fetch(FHIR_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: raw,
  });

  if (res.ok) {
    const result = await res.json();
    const resultEntries = result.entry || [];
    const errors = resultEntries.filter(
      (e: { response?: { status?: string } }) =>
        e.response?.status && !e.response.status.startsWith('2')
    ).length;
    return { total: entries.length, errors };
  }

  // If batch POST fails, fall back to individual resource uploads
  console.log(`  Batch upload failed (${res.status}), falling back to individual uploads...`);
  let total = 0;
  let errors = 0;

  for (const entry of entries) {
    const resource = entry.resource;
    if (!resource?.resourceType) continue;

    try {
      const individualRes = await fetch(
        `${FHIR_SERVER_URL}/${resource.resourceType}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/fhir+json' },
          body: JSON.stringify(resource),
        }
      );
      if (!individualRes.ok) errors++;
      total++;
    } catch {
      errors++;
      total++;
    }
  }

  return { total, errors };
}

async function main() {
  const bundleDir = process.argv[2];

  if (!bundleDir) {
    console.log('========================================');
    console.log('  HealthSync AI - Load FHIR Data');
    console.log('========================================\n');
    console.log('Usage: npm run load:fhir-data -- <path-to-synthea-output>\n');
    console.log('Steps to generate test data:');
    console.log('  1. Download Synthea: https://github.com/synthetichealth/synthea');
    console.log('  2. Generate bundles: java -jar synthea-with-dependencies.jar -p 10');
    console.log('  3. Run: npm run load:fhir-data -- ./output/fhir\n');
    console.log('Make sure the FHIR server is running: docker-compose up -d');
    process.exit(1);
  }

  const resolvedDir = path.resolve(bundleDir);
  if (!fs.existsSync(resolvedDir)) {
    console.error(`Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(resolvedDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(resolvedDir, f));

  if (files.length === 0) {
    console.error(`No JSON files found in ${resolvedDir}`);
    process.exit(1);
  }

  console.log('========================================');
  console.log('  HealthSync AI - Load FHIR Data');
  console.log('========================================\n');

  await waitForServer();

  console.log(`Found ${files.length} bundle files in ${resolvedDir}\n`);

  let totalResources = 0;
  let totalErrors = 0;

  for (const file of files) {
    const { total, errors } = await loadBundle(file);
    totalResources += total;
    totalErrors += errors;
  }

  console.log('\n========================================');
  console.log(`  Loaded ${totalResources} resources (${totalErrors} errors)`);
  console.log('========================================');

  if (totalErrors > 0) {
    console.log('\nSome resources failed to load. This is normal for duplicate IDs.');
  }

  console.log('\nNext step: Index into Elasticsearch with:');
  console.log('  npm run index:fhir');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
