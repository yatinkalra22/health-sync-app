import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';

const ES_INDICES = {
  PATIENTS: 'healthsync-patients',
  CONDITIONS: 'healthsync-conditions',
  MEDICATIONS: 'healthsync-medications',
  PROCEDURES: 'healthsync-procedures',
  OBSERVATIONS: 'healthsync-observations',
} as const;

const RESOURCE_CONFIG: Array<{
  resourceType: string;
  index: string;
  idField: string;
  transform: (resource: Record<string, unknown>) => Record<string, unknown>;
}> = [
  {
    resourceType: 'Patient',
    index: ES_INDICES.PATIENTS,
    idField: 'patient_id',
    transform: (r) => {
      const names = r.name as Array<{ family?: string; given?: string[] }> | undefined;
      const name = names?.[0];
      const addresses = r.address as Array<{
        line?: string[];
        city?: string;
        state?: string;
        postalCode?: string;
      }> | undefined;
      const addr = addresses?.[0];
      return {
        patient_id: r.id,
        resource_type: 'Patient',
        name: {
          family: name?.family || '',
          given: name?.given || [],
          full: [
            ...(name?.given || []),
            name?.family || '',
          ].filter(Boolean).join(' '),
        },
        birthDate: r.birthDate || null,
        gender: r.gender || null,
        address: addr
          ? {
              line: addr.line || [],
              city: addr.city || '',
              state: addr.state || '',
              postalCode: addr.postalCode || '',
            }
          : null,
        created_at: new Date().toISOString(),
      };
    },
  },
  {
    resourceType: 'Condition',
    index: ES_INDICES.CONDITIONS,
    idField: 'condition_id',
    transform: (r) => {
      const code = r.code as { coding?: Array<{ system: string; code: string; display: string }>; text?: string } | undefined;
      const clinicalStatus = r.clinicalStatus as { coding?: Array<{ code: string }> } | undefined;
      const severity = r.severity as { coding?: Array<{ display: string }> } | undefined;
      const subject = r.subject as { reference?: string } | undefined;
      const patientId = subject?.reference?.replace('Patient/', '') || '';
      return {
        condition_id: r.id,
        patient_id: patientId,
        code: {
          coding: code?.coding || [],
          text: code?.text || code?.coding?.[0]?.display || '',
        },
        clinicalStatus: clinicalStatus?.coding?.[0]?.code || 'unknown',
        severity: severity?.coding?.[0]?.display || null,
        onsetDateTime: r.onsetDateTime || null,
        recordedDate: r.recordedDate || null,
      };
    },
  },
  {
    resourceType: 'MedicationRequest',
    index: ES_INDICES.MEDICATIONS,
    idField: 'medication_id',
    transform: (r) => {
      const med = r.medicationCodeableConcept as { coding?: Array<{ system: string; code: string; display: string }>; text?: string } | undefined;
      const subject = r.subject as { reference?: string } | undefined;
      const patientId = subject?.reference?.replace('Patient/', '') || '';
      return {
        medication_id: r.id,
        patient_id: patientId,
        medicationCodeableConcept: {
          coding: med?.coding || [],
          text: med?.text || med?.coding?.[0]?.display || '',
        },
        authoredOn: r.authoredOn || null,
        status: r.status || 'unknown',
      };
    },
  },
  {
    resourceType: 'Procedure',
    index: ES_INDICES.PROCEDURES,
    idField: 'procedure_id',
    transform: (r) => {
      const code = r.code as { coding?: Array<{ system: string; code: string; display: string }>; text?: string } | undefined;
      const subject = r.subject as { reference?: string } | undefined;
      const patientId = subject?.reference?.replace('Patient/', '') || '';
      const performed = (r.performedPeriod as { start?: string })?.start || r.performedDateTime;
      return {
        procedure_id: r.id,
        patient_id: patientId,
        code: {
          coding: code?.coding || [],
          text: code?.text || code?.coding?.[0]?.display || '',
        },
        performedDateTime: performed || null,
        status: r.status || 'unknown',
      };
    },
  },
  {
    resourceType: 'Observation',
    index: ES_INDICES.OBSERVATIONS,
    idField: 'observation_id',
    transform: (r) => {
      const code = r.code as { coding?: Array<{ system: string; code: string; display: string }>; text?: string } | undefined;
      const valueQuantity = r.valueQuantity as { value?: number; unit?: string } | undefined;
      const subject = r.subject as { reference?: string } | undefined;
      const patientId = subject?.reference?.replace('Patient/', '') || '';
      return {
        observation_id: r.id,
        patient_id: patientId,
        code: {
          coding: code?.coding || [],
          text: code?.text || code?.coding?.[0]?.display || '',
        },
        valueQuantity: valueQuantity
          ? { value: valueQuantity.value ?? 0, unit: valueQuantity.unit || '' }
          : null,
        effectiveDateTime: r.effectiveDateTime || null,
        status: r.status || 'unknown',
      };
    },
  },
];

async function fetchAllFromFHIR(resourceType: string): Promise<Record<string, unknown>[]> {
  const resources: Record<string, unknown>[] = [];
  let url = `${FHIR_SERVER_URL}/${resourceType}?_count=100`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  Warning: Failed to fetch ${resourceType} (${res.status})`);
      break;
    }
    const bundle = await res.json();
    const entries = bundle.entry || [];
    for (const entry of entries) {
      if (entry.resource) {
        resources.push(entry.resource);
      }
    }

    // Follow pagination
    const nextLink = (bundle.link || []).find(
      (l: { relation: string; url: string }) => l.relation === 'next'
    );
    url = nextLink?.url || '';
  }

  return resources;
}

async function main() {
  console.log('========================================');
  console.log('  HealthSync AI - Index FHIR to ES');
  console.log('========================================\n');

  // Validate Elasticsearch config
  if (!process.env.ELASTICSEARCH_CLOUD_ID || !process.env.ELASTICSEARCH_API_KEY) {
    console.error('Elasticsearch credentials not configured.');
    console.error('Set ELASTICSEARCH_CLOUD_ID and ELASTICSEARCH_API_KEY in .env.local');
    process.exit(1);
  }

  const es = new Client({
    cloud: { id: process.env.ELASTICSEARCH_CLOUD_ID },
    auth: { apiKey: process.env.ELASTICSEARCH_API_KEY },
  });

  // Verify connections
  try {
    const info = await es.info();
    console.log(`Elasticsearch: Connected (v${info.version.number})`);
  } catch {
    console.error('Failed to connect to Elasticsearch. Check credentials.');
    process.exit(1);
  }

  try {
    const res = await fetch(`${FHIR_SERVER_URL}/metadata`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('not ok');
    console.log('FHIR Server: Connected\n');
  } catch {
    console.error(`FHIR server not available at ${FHIR_SERVER_URL}`);
    console.error('Start it with: docker-compose up -d');
    process.exit(1);
  }

  let totalIndexed = 0;

  for (const config of RESOURCE_CONFIG) {
    process.stdout.write(`Indexing ${config.resourceType}...`);

    const resources = await fetchAllFromFHIR(config.resourceType);
    if (resources.length === 0) {
      console.log(' 0 found, skipping.');
      continue;
    }

    // Bulk index into Elasticsearch
    const operations = resources.flatMap((resource) => {
      const doc = config.transform(resource);
      return [
        { index: { _index: config.index, _id: doc[config.idField] as string } },
        doc,
      ];
    });

    const bulkResult = await es.bulk({ operations, refresh: true });

    const errorCount = bulkResult.items.filter((item) => item.index?.error).length;
    const indexed = resources.length - errorCount;
    totalIndexed += indexed;

    console.log(` ${indexed}/${resources.length} indexed${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
  }

  console.log('\n========================================');
  console.log(`  Total: ${totalIndexed} resources indexed`);
  console.log('========================================');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
