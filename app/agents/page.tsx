import AgentMonitor from '@/components/agents/AgentMonitor';
import { elasticsearch, searchPARequests } from '@/lib/services/elasticsearch';
import { getAllDemoPARequests } from '@/mock';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  let paRequests;
  if (elasticsearch) {
    paRequests = await searchPARequests({ limit: 100 });
  } else {
    paRequests = getAllDemoPARequests();
  }
  return <AgentMonitor paRequests={paRequests} />;
}
