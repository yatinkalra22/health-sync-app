import AgentMonitor from '@/components/agents/AgentMonitor';
import { getAllDemoPARequests } from '@/lib/demo-store';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const paRequests = getAllDemoPARequests();
  return <AgentMonitor paRequests={paRequests} />;
}
