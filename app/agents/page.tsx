import AgentMonitor from '@/components/agents/AgentMonitor';
import { getAllDemoPARequests } from '@/mock';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const paRequests = getAllDemoPARequests();
  return <AgentMonitor paRequests={paRequests} />;
}
