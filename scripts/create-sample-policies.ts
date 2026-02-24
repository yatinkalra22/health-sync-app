import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
