import PADashboard from '@/components/dashboard/PADashboard';
import { elasticsearch, searchPARequests } from '@/lib/services/elasticsearch';
import { getAllDemoPARequests } from '@/mock';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let paRequests;

  if (elasticsearch) {
    paRequests = await searchPARequests({});
    // Fall back to demo data if ES is connected but indices are empty/missing
    if (paRequests.length === 0) {
      paRequests = getAllDemoPARequests();
    }
  } else {
    paRequests = getAllDemoPARequests();
  }

  return <PADashboard initialData={paRequests} />;
}
