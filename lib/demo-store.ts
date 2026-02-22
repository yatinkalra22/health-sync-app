/**
 * In-memory demo store for full demo mode.
 * Allows creating, updating, and processing PA requests without Elasticsearch.
 * State resets on server restart - this is intentional for demo purposes.
 */

import { DEMO_PA_REQUESTS } from './demo-data';
import type { PARequest } from './types/pa';

// Deep-clone demo data so mutations don't affect the original
let store: PARequest[] = JSON.parse(JSON.stringify(DEMO_PA_REQUESTS));

export function getAllDemoPARequests(filters?: { status?: string; limit?: number }): PARequest[] {
  let results = [...store];

  if (filters?.status) {
    results = results.filter(r => r.status === filters.status);
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filters?.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}

export function getDemoPARequest(paId: string): PARequest | null {
  return store.find(r => r.pa_id === paId) || null;
}

export function addDemoPARequest(pa: PARequest): void {
  store.unshift(pa);
}

export function updateDemoPARequest(paId: string, updates: Partial<PARequest>): boolean {
  const index = store.findIndex(r => r.pa_id === paId);
  if (index === -1) return false;

  store[index] = { ...store[index], ...updates, updated_at: new Date().toISOString() };
  return true;
}

export function getDemoStore(): PARequest[] {
  return store;
}
