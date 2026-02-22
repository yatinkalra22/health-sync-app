import { Client } from '@elastic/elasticsearch';
import type { SearchRequest, UpdateRequest } from '@elastic/elasticsearch/lib/api/types';
import { ES_INDICES, API_DEFAULT_PAGE_SIZE, API_MAX_PAGE_SIZE } from '@/lib/constants';

function createClient(): Client | null {
  if (!process.env.ELASTICSEARCH_CLOUD_ID || !process.env.ELASTICSEARCH_API_KEY) {
    console.warn('Elasticsearch credentials not configured - running in demo mode');
    return null;
  }

  return new Client({
    cloud: {
      id: process.env.ELASTICSEARCH_CLOUD_ID,
    },
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY,
    },
  });
}

export const elasticsearch = createClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchPARequests(filters: {
  status?: string;
  patient_id?: string;
  limit?: number;
} = {}): Promise<any[]> {
  if (!elasticsearch) return [];

  const mustClauses: object[] = [];

  if (filters.status) {
    mustClauses.push({ term: { status: filters.status } });
  }

  if (filters.patient_id) {
    mustClauses.push({ term: { patient_id: filters.patient_id } });
  }

  if (mustClauses.length === 0) {
    mustClauses.push({ match_all: {} });
  }

  const result = await elasticsearch.search({
    index: ES_INDICES.PA_REQUESTS,
    query: {
      bool: { must: mustClauses },
    },
    sort: [{ created_at: { order: 'desc' } }],
    size: Math.min(filters.limit || API_DEFAULT_PAGE_SIZE, API_MAX_PAGE_SIZE),
  } as SearchRequest);

  return result.hits.hits.map((hit) => ({
    ...(hit._source as object),
    _id: hit._id,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function indexPARequest(paRequest: Record<string, any>) {
  if (!elasticsearch) return paRequest.pa_id as string;

  const result = await elasticsearch.index({
    index: ES_INDICES.PA_REQUESTS,
    id: paRequest.pa_id as string,
    document: paRequest,
  });

  return result._id;
}

export async function getPARequest(paId: string) {
  if (!elasticsearch) return null;

  try {
    const result = await elasticsearch.get({
      index: ES_INDICES.PA_REQUESTS,
      id: paId,
    });

    return result._source;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePARequest(paId: string, updates: Record<string, any>) {
  if (!elasticsearch) return;

  await elasticsearch.update({
    index: ES_INDICES.PA_REQUESTS,
    id: paId,
    doc: updates,
  } as UpdateRequest);
}
