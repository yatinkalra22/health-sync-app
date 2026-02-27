/**
 * Static mock analytics data for demo mode.
 */

export const MOCK_PROCESSING_TIMELINE = [
  { day: 'Mon', submitted: 3, processed: 2 },
  { day: 'Tue', submitted: 5, processed: 4 },
  { day: 'Wed', submitted: 2, processed: 3 },
  { day: 'Thu', submitted: 4, processed: 3 },
  { day: 'Fri', submitted: 6, processed: 5 },
  { day: 'Sat', submitted: 1, processed: 2 },
  { day: 'Sun', submitted: 2, processed: 1 },
];

export const MOCK_AGENT_PERFORMANCE = [
  { agent: 'ClinicalDataGatherer', avg_duration_ms: 1200, success_rate: 98 },
  { agent: 'PolicyAnalyzer', avg_duration_ms: 2400, success_rate: 95 },
  { agent: 'DocumentationAssembler', avg_duration_ms: 3100, success_rate: 97 },
  { agent: 'ComplianceValidator', avg_duration_ms: 800, success_rate: 100 },
];
