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

// ---------------------
// ES|QL Query Helper
// ---------------------
export async function esqlQuery<T = Record<string, unknown>>(
  query: string
): Promise<T[]> {
  if (!elasticsearch) return [];

  const result = await elasticsearch.esql.query({
    query,
    format: 'json',
  });

  // ES|QL returns { columns: [...], values: [[...], ...] }
  const columns = (result as { columns: Array<{ name: string }> }).columns;
  const values = (result as { values: unknown[][] }).values || [];

  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col.name] = row[i];
    });
    return obj as T;
  });
}

// ---------------------
// PA Request CRUD
// ---------------------

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

  try {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('index_not_found_exception')) {
      console.warn(`Index ${ES_INDICES.PA_REQUESTS} not found. Run "npm run setup:es" to create indices.`);
      return [];
    }
    throw err;
  }
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

// ---------------------
// ES|QL Analytics Queries
// ---------------------
export async function getAnalyticsWithESQL() {
  if (!elasticsearch) return null;

  const [statusCounts, payerCounts, avgConfidence] = await Promise.all([
    esqlQuery(`
      FROM ${ES_INDICES.PA_REQUESTS}
      | STATS count = COUNT(*) BY status
      | SORT count DESC
    `),
    esqlQuery(`
      FROM ${ES_INDICES.PA_REQUESTS}
      | STATS count = COUNT(*) BY payer
      | SORT count DESC
    `),
    esqlQuery(`
      FROM ${ES_INDICES.PA_REQUESTS}
      | STATS total = COUNT(*)
    `).catch(() => []),
  ]);

  return { statusCounts, payerCounts, avgConfidence };
}

// ---------------------
// Audit Logging
// ---------------------
export interface AuditLogEntry {
  audit_id: string;
  timestamp: string;
  action: string;
  agent: string;
  pa_id: string;
  patient_id?: string;
  details: string;
  phi_accessed: boolean;
  duration_ms?: number;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  if (!elasticsearch) return;

  try {
    await elasticsearch.index({
      index: ES_INDICES.AUDIT_LOGS,
      id: entry.audit_id,
      document: entry,
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}

export async function getRecentAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  if (!elasticsearch) return [];

  try {
    const result = await elasticsearch.search({
      index: ES_INDICES.AUDIT_LOGS,
      sort: [{ timestamp: { order: 'desc' } }],
      size: limit,
    } as SearchRequest);

    return result.hits.hits.map((hit) => hit._source as AuditLogEntry);
  } catch {
    return [];
  }
}
