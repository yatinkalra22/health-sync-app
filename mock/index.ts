/**
 * Central mock module - re-exports all mock data, store, and agents.
 *
 * Usage:
 *   import { getAllDemoPARequests, runDemoAgentPipeline } from '@/mock';
 */

// Data
export { DEMO_PA_REQUESTS, getDemoMetrics } from './data/pa-requests';
export { DEMO_SCENARIOS } from './data/demo-scenarios';
export { MOCK_PROCESSING_TIMELINE, MOCK_AGENT_PERFORMANCE } from './data/analytics';

// Store
export {
  getAllDemoPARequests,
  getDemoPARequest,
  addDemoPARequest,
  updateDemoPARequest,
  getDemoStore,
  resetDemoStore,
  getDemoAuditLogs,
} from './store/demo-store';

// Agents
export { runDemoAgentPipeline } from './agents/demo-agent-runner';
export type { DemoAgentResult } from './agents/demo-agent-runner';

// Policies
export { SAMPLE_POLICIES } from './policies/sample-policies';
