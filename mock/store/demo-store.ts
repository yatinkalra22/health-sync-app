/**
 * In-memory demo store for full mock mode.
 * Allows creating, updating, and processing PA requests without Elasticsearch.
 * State resets on server restart - this is intentional for demo purposes.
 */

import { DEMO_PA_REQUESTS } from '@/mock/data/pa-requests';
import type { PARequest } from '@/lib/types/pa';

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

export function resetDemoStore(): void {
  store = JSON.parse(JSON.stringify(DEMO_PA_REQUESTS));
}

// Demo audit log data
export function getDemoAuditLogs() {
  const baseTime = Date.now();
  const paIds = store.filter(r => r.execution_log && r.execution_log.length > 0).map(r => r.pa_id);

  const logs: Array<{
    audit_id: string;
    timestamp: string;
    action: string;
    agent: string;
    pa_id: string;
    patient_id?: string;
    details: string;
    phi_accessed: boolean;
    duration_ms?: number;
    esql_query?: string;
  }> = [];

  paIds.forEach((paId, paIdx) => {
    const pa = store.find(r => r.pa_id === paId);
    if (!pa) return;
    const offset = paIdx * 15000;

    logs.push({
      audit_id: `AUD-${paId}-001`,
      timestamp: new Date(baseTime - offset - 12000).toISOString(),
      action: 'workflow_started',
      agent: 'CoordinatorAgent',
      pa_id: paId,
      patient_id: pa.patient_id,
      details: `Initiated PA processing pipeline for ${paId}`,
      phi_accessed: false,
      duration_ms: 45,
    });

    logs.push({
      audit_id: `AUD-${paId}-002`,
      timestamp: new Date(baseTime - offset - 10000).toISOString(),
      action: 'clinical_data_accessed',
      agent: 'ClinicalDataGatherer',
      pa_id: paId,
      patient_id: pa.patient_id,
      details: `Queried patient clinical data across 4 FHIR indices for ${pa.patient_id}`,
      phi_accessed: true,
      duration_ms: 1200,
      esql_query: `FROM healthsync-conditions\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_conditions = COUNT(*),\n       active = COUNT_DISTINCT(clinicalStatus)`,
    });

    logs.push({
      audit_id: `AUD-${paId}-003`,
      timestamp: new Date(baseTime - offset - 7000).toISOString(),
      action: 'policy_analyzed',
      agent: 'PolicyAnalyzer',
      pa_id: paId,
      details: `Matched payer policies for ${pa.payer} — procedure ${pa.procedure_code}`,
      phi_accessed: false,
      duration_ms: 2400,
      esql_query: `FROM healthsync-policies\n| WHERE payer == "${pa.payer}"\n| STATS total_policies = COUNT(*),\n       procedure_count = COUNT_DISTINCT(procedure_codes)`,
    });

    logs.push({
      audit_id: `AUD-${paId}-004`,
      timestamp: new Date(baseTime - offset - 4000).toISOString(),
      action: 'pa_packet_generated',
      agent: 'DocumentationAssembler',
      pa_id: paId,
      patient_id: pa.patient_id,
      details: `Generated PA packet with medical necessity narrative for ${pa.patient_id}`,
      phi_accessed: true,
      duration_ms: 3100,
    });

    logs.push({
      audit_id: `AUD-${paId}-005`,
      timestamp: new Date(baseTime - offset - 2000).toISOString(),
      action: 'compliance_validated',
      agent: 'ComplianceValidator',
      pa_id: paId,
      details: `Validated CMS timeline compliance and documentation completeness`,
      phi_accessed: false,
      duration_ms: 800,
      esql_query: `FROM healthsync-pa-requests\n| WHERE pa_id == "${paId}"\n| STATS compliance_score = AVG(compliance_score)`,
    });

    logs.push({
      audit_id: `AUD-${paId}-006`,
      timestamp: new Date(baseTime - offset - 500).toISOString(),
      action: 'workflow_completed',
      agent: 'CoordinatorAgent',
      pa_id: paId,
      details: `Pipeline completed — status: ${pa.status}`,
      phi_accessed: false,
      duration_ms: 8300,
    });
  });

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return logs;
}
