import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const es = new Client({
  cloud: {
    id: process.env.ELASTICSEARCH_CLOUD_ID!,
  },
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY!,
  },
});

async function testConnection() {
  const info = await es.info();
  console.log('Connected to Elasticsearch:', info.version.number);
}

const indices: Record<string, object> = {
  'healthsync-patients': {
    mappings: {
      properties: {
        patient_id: { type: 'keyword' },
        resource_type: { type: 'keyword' },
        name: {
          properties: {
            family: { type: 'text' },
            given: { type: 'text' },
            full: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          },
        },
        birthDate: { type: 'date' },
        gender: { type: 'keyword' },
        address: {
          properties: {
            line: { type: 'text' },
            city: { type: 'keyword' },
            state: { type: 'keyword' },
            postalCode: { type: 'keyword' },
          },
        },
        created_at: { type: 'date' },
      },
    },
  },
  'healthsync-conditions': {
    mappings: {
      properties: {
        condition_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        code: {
          properties: {
            coding: {
              type: 'nested',
              properties: {
                system: { type: 'keyword' },
                code: { type: 'keyword' },
                display: { type: 'text' },
              },
            },
            text: { type: 'text' },
          },
        },
        severity: { type: 'keyword' },
        onsetDateTime: { type: 'date' },
        recordedDate: { type: 'date' },
        clinicalStatus: { type: 'keyword' },
      },
    },
  },
  'healthsync-medications': {
    mappings: {
      properties: {
        medication_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        medicationCodeableConcept: {
          properties: {
            coding: {
              type: 'nested',
              properties: {
                system: { type: 'keyword' },
                code: { type: 'keyword' },
                display: { type: 'text' },
              },
            },
            text: { type: 'text' },
          },
        },
        authoredOn: { type: 'date' },
        status: { type: 'keyword' },
      },
    },
  },
  'healthsync-procedures': {
    mappings: {
      properties: {
        procedure_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        code: { properties: { coding: { type: 'nested' }, text: { type: 'text' } } },
        performedDateTime: { type: 'date' },
        status: { type: 'keyword' },
      },
    },
  },
  'healthsync-observations': {
    mappings: {
      properties: {
        observation_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        code: { properties: { coding: { type: 'nested' }, text: { type: 'text' } } },
        valueQuantity: {
          properties: {
            value: { type: 'float' },
            unit: { type: 'keyword' },
          },
        },
        effectiveDateTime: { type: 'date' },
        status: { type: 'keyword' },
      },
    },
  },
  'healthsync-pa-requests': {
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
        compliance_score: { type: 'float' },
        hitl_required: { type: 'boolean' },
        pa_packet: { type: 'object', enabled: false },
      },
    },
  },
  'healthsync-policies': {
    mappings: {
      properties: {
        policy_id: { type: 'keyword' },
        payer: { type: 'keyword' },
        policy_name: { type: 'text' },
        policy_text: { type: 'text' },
        procedure_codes: { type: 'keyword' },
        diagnosis_codes: { type: 'keyword' },
        coverage_criteria: { type: 'text' },
        documentation_requirements: { type: 'text' },
        effective_date: { type: 'date' },
      },
    },
  },
  'healthsync-audit-logs': {
    mappings: {
      properties: {
        audit_id: { type: 'keyword' },
        timestamp: { type: 'date' },
        action: { type: 'keyword' },
        agent: { type: 'keyword' },
        pa_id: { type: 'keyword' },
        patient_id: { type: 'keyword' },
        details: { type: 'text' },
        phi_accessed: { type: 'boolean' },
        duration_ms: { type: 'integer' },
      },
    },
  },
};

async function createIndices() {
  for (const [indexName, config] of Object.entries(indices)) {
    const exists = await es.indices.exists({ index: indexName });
    if (exists) {
      console.log(`Index ${indexName} already exists. Skipping.`);
    } else {
      await es.indices.create({ index: indexName, ...config });
      console.log(`Created index: ${indexName}`);
    }
  }
}

async function main() {
  try {
    await testConnection();
    await createIndices();
    console.log('\nAll indices created successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
