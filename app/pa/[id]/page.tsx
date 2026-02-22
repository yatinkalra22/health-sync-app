import { notFound } from 'next/navigation';
import { elasticsearch, getPARequest } from '@/lib/services/elasticsearch';
import { getDemoPARequest } from '@/lib/demo-store';
import PADetailView from '@/components/pa-details/PADetailView';
import type { PARequest } from '@/lib/types/pa';

export const dynamic = 'force-dynamic';

export default async function PADetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let pa: PARequest | null = null;

  if (elasticsearch) {
    const result = await getPARequest(id);
    if (result) {
      pa = result as PARequest;
    }
  } else {
    pa = getDemoPARequest(id);
  }

  if (!pa) {
    notFound();
  }

  return <PADetailView pa={pa} />;
}
