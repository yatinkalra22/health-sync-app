// ---------------------
// AI / LLM
// ---------------------
export const LLM_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
export const LLM_DEFAULT_MAX_TOKENS = 4000;

// ---------------------
// Elasticsearch Indices
// ---------------------
const INDEX_PREFIX = 'healthsync';

export const ES_INDICES = {
  PATIENTS: `${INDEX_PREFIX}-patients`,
  CONDITIONS: `${INDEX_PREFIX}-conditions`,
  MEDICATIONS: `${INDEX_PREFIX}-medications`,
  PROCEDURES: `${INDEX_PREFIX}-procedures`,
  OBSERVATIONS: `${INDEX_PREFIX}-observations`,
  PA_REQUESTS: `${INDEX_PREFIX}-pa-requests`,
  POLICIES: `${INDEX_PREFIX}-policies`,
} as const;

// ---------------------
// PA Statuses
// ---------------------
export const PA_STATUSES = [
  'submitted',
  'processing',
  'ready_for_review',
  'hitl_required',
  'approved',
  'denied',
  'failed',
] as const;

export const PA_URGENCY_OPTIONS = ['standard', 'expedited'] as const;

// ---------------------
// Payers
// ---------------------
export const PAYERS = [
  'Medicare',
  'Blue Cross',
  'Aetna',
  'UnitedHealthcare',
  'Cigna',
  'Humana',
] as const;

// ---------------------
// Common Procedure Codes
// ---------------------
export const COMMON_PROCEDURES = [
  { code: '27447', label: 'Total Knee Replacement' },
  { code: '29881', label: 'Knee Arthroscopy with Meniscectomy' },
  { code: '29880', label: 'Knee Arthroscopy with Meniscus Repair' },
  { code: '27130', label: 'Total Hip Replacement' },
  { code: '63030', label: 'Lumbar Discectomy' },
] as const;

// ---------------------
// API Defaults
// ---------------------
export const API_DEFAULT_PAGE_SIZE = 50;
export const API_MAX_PAGE_SIZE = 100;
export const SSE_POLL_INTERVAL_MS = 2000;
export const SWR_REFRESH_INTERVAL_MS = 5000;

// ---------------------
// FHIR
// ---------------------
export const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';
