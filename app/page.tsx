import PADashboard from '@/components/dashboard/PADashboard';
import { elasticsearch, searchPARequests } from '@/lib/services/elasticsearch';
import { DEMO_PA_REQUESTS } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let paRequests;

  if (elasticsearch) {
    paRequests = await searchPARequests({});
  } else {
    paRequests = DEMO_PA_REQUESTS;
  }

  return <PADashboard initialData={paRequests} />;
}
