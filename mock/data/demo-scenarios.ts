/**
 * Quick demo scenario definitions for one-click PA submissions.
 */
export const DEMO_SCENARIOS = [
  {
    id: 'expedited',
    title: 'Expedited Knee Surgery',
    description: 'Urgent total knee replacement requiring fast-track approval',
    formData: {
      patient_id: 'patient-demo-001',
      procedure_code: '27447',
      diagnosis_codes: 'M17.11,M25.561',
      urgency: 'expedited',
      payer: 'Blue Cross Blue Shield',
      clinician_id: 'Dr. Sarah Chen',
      notes: 'Patient experiencing severe pain, limited mobility. Conservative treatment exhausted over 6 months.',
    },
  },
  {
    id: 'hitl',
    title: 'Missing Documentation',
    description: 'Case requiring human-in-the-loop review for completeness',
    formData: {
      patient_id: 'patient-demo-002',
      procedure_code: '29881',
      diagnosis_codes: 'M23.211',
      urgency: 'standard',
      payer: 'Aetna',
      clinician_id: 'Dr. Michael Torres',
      notes: 'Arthroscopic meniscectomy. Prior imaging not yet available.',
    },
  },
  {
    id: 'quick',
    title: 'Quick Approval',
    description: 'Straightforward case with complete documentation for fast approval',
    formData: {
      patient_id: 'patient-demo-003',
      procedure_code: '43239',
      diagnosis_codes: 'K21.0,K44.9',
      urgency: 'standard',
      payer: 'Medicare',
      clinician_id: 'Dr. Lisa Park',
      notes: 'Upper GI endoscopy with biopsy. All pre-op labs and imaging available.',
    },
  },
] as const;
