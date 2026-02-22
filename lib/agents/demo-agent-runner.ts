/**
 * Simulates the 5-agent PA processing pipeline in demo mode.
 * Generates realistic clinical data, policy analysis, PA packets, and compliance checks
 * with step-by-step execution logging - no external services required.
 */

import type { PARequest, ClinicalData, PolicyAnalysis, PAPacket, ComplianceChecks, ExecutionLogEntry } from '@/lib/types/pa';

const DEMO_PATIENT_PROFILES: Record<string, {
  name: { family: string; given: string[]; full: string };
  birthDate: string;
  gender: string;
  address: { city: string; state: string; postalCode: string };
}> = {
  default: {
    name: { family: 'Smith', given: ['James', 'R'], full: 'James R Smith' },
    birthDate: '1962-07-22',
    gender: 'male',
    address: { city: 'Chicago', state: 'IL', postalCode: '60601' },
  },
};

const PROCEDURE_DETAILS: Record<string, { name: string; criteria: string[]; docs: string[] }> = {
  '27447': {
    name: 'Total Knee Replacement',
    criteria: ['Failed conservative treatment 6+ weeks', 'MRI confirms structural damage', 'Pain >= 5/10', 'Medical clearance for surgery'],
    docs: ['Physical therapy notes (6+ weeks)', 'MRI report with interpretation', 'Clinical evaluation notes', 'Pain assessment documentation'],
  },
  '29881': {
    name: 'Knee Arthroscopy with Meniscectomy',
    criteria: ['MRI confirms meniscal tear', 'Mechanical symptoms present', 'Failed conservative treatment 4+ weeks'],
    docs: ['MRI report', 'Clinical evaluation', 'Physical therapy notes'],
  },
  '29880': {
    name: 'Knee Arthroscopy with Meniscus Repair',
    criteria: ['MRI confirms repairable meniscal tear', 'Patient age appropriate for repair', 'Failed conservative treatment'],
    docs: ['MRI report', 'Surgical consultation notes', 'Physical therapy notes'],
  },
  '27130': {
    name: 'Total Hip Replacement',
    criteria: ['Failed conservative treatment 6+ weeks', 'Imaging confirms joint deterioration', 'Significant functional impairment', 'Medical clearance'],
    docs: ['X-ray/MRI report', 'Physical therapy notes', 'Pain assessment', 'Pre-op clearance'],
  },
  '63030': {
    name: 'Lumbar Discectomy',
    criteria: ['MRI confirms disc herniation', 'Radiculopathy present', 'Failed 6+ weeks conservative treatment', 'Neurological deficits documented'],
    docs: ['MRI report', 'Neurological examination', 'Physical therapy notes', 'EMG/NCS results'],
  },
};

function getAge(birthDate: string): number {
  const born = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age;
}

function generateClinicalData(patientId: string, procedureCode: string, diagnosisCodes: string[]): ClinicalData {
  const profile = DEMO_PATIENT_PROFILES[patientId] || DEMO_PATIENT_PROFILES.default;
  const age = getAge(profile.birthDate);

  return {
    patient_demographics: {
      patient_id: patientId,
      name: profile.name,
      birthDate: profile.birthDate,
      gender: profile.gender,
      address: profile.address,
    },
    conditions: [
      { condition_id: `C-${Date.now()}-1`, patient_id: patientId, code: { text: 'Primary osteoarthritis, right knee' }, clinicalStatus: 'active', onsetDateTime: '2024-03-15' },
      { condition_id: `C-${Date.now()}-2`, patient_id: patientId, code: { text: 'Essential hypertension' }, clinicalStatus: 'active', onsetDateTime: '2020-08-10' },
      { condition_id: `C-${Date.now()}-3`, patient_id: patientId, code: { text: 'Type 2 diabetes mellitus' }, clinicalStatus: 'active', onsetDateTime: '2021-02-14' },
    ],
    medications: [
      { medication_id: `M-${Date.now()}-1`, patient_id: patientId, medicationCodeableConcept: { text: 'Ibuprofen 400mg PRN' }, status: 'active', authoredOn: '2024-04-01' },
      { medication_id: `M-${Date.now()}-2`, patient_id: patientId, medicationCodeableConcept: { text: 'Lisinopril 10mg' }, status: 'active', authoredOn: '2020-09-01' },
      { medication_id: `M-${Date.now()}-3`, patient_id: patientId, medicationCodeableConcept: { text: 'Metformin 500mg' }, status: 'active', authoredOn: '2021-03-01' },
    ],
    procedures: [
      { procedure_id: `P-${Date.now()}-1`, patient_id: patientId, code: { text: 'Physical therapy evaluation' }, status: 'completed', performedDateTime: '2024-06-15' },
      { procedure_id: `P-${Date.now()}-2`, patient_id: patientId, code: { text: 'Knee MRI - Right' }, status: 'completed', performedDateTime: '2024-09-20' },
    ],
    observations: [
      { observation_id: `O-${Date.now()}-1`, patient_id: patientId, code: { text: 'Pain severity - right knee' }, valueQuantity: { value: 7, unit: '/10' }, effectiveDateTime: '2025-01-10', status: 'final' },
      { observation_id: `O-${Date.now()}-2`, patient_id: patientId, code: { text: 'BMI' }, valueQuantity: { value: 29.1, unit: 'kg/m2' }, effectiveDateTime: '2025-01-10', status: 'final' },
      { observation_id: `O-${Date.now()}-3`, patient_id: patientId, code: { text: 'HbA1c' }, valueQuantity: { value: 7.1, unit: '%' }, effectiveDateTime: '2025-01-05', status: 'final' },
    ],
    clinical_summary: `${profile.name.full} is a ${age}-year-old ${profile.gender} presenting with ${diagnosisCodes.join(', ')} requiring ${PROCEDURE_DETAILS[procedureCode]?.name || `CPT ${procedureCode}`}. Patient has undergone conservative treatment including physical therapy and NSAID therapy with inadequate relief. Current pain severity rated at 7/10. Comorbidities include well-controlled hypertension and type 2 diabetes. MRI confirms structural damage supporting surgical intervention.`,
    complexity_score: 0.72,
  };
}

function generatePolicyAnalysis(procedureCode: string, diagnosisCodes: string[], payer: string): PolicyAnalysis {
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];

  return {
    matched_policies: [{
      policy_id: `${payer.toUpperCase().replace(/\s/g, '_')}_${procedureCode}`,
      payer,
      policy_name: `${payer} ${proc.name} Coverage Policy`,
      procedure_codes: [procedureCode],
      diagnosis_codes: diagnosisCodes,
      coverage_criteria: proc.criteria,
      documentation_requirements: proc.docs,
      policy_text: `${payer} covers ${proc.name} (CPT ${procedureCode}) when medical necessity criteria are met including: ${proc.criteria.join('; ')}.`,
    }],
    coverage_criteria: proc.criteria,
    documentation_requirements: proc.docs,
    coverage_probability: 0.82,
    policy_analysis: `Patient meets ${proc.criteria.length - 1} of ${proc.criteria.length} major coverage criteria for ${proc.name} under ${payer}. Conservative treatment history and imaging findings support medical necessity. One criterion requires additional documentation verification.`,
  };
}

function generatePAPacket(patientId: string, procedureCode: string, diagnosisCodes: string[], payer: string, urgency: string, clinicalData: ClinicalData, policyAnalysis: PolicyAnalysis): PAPacket {
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];
  const patientName = (clinicalData.patient_demographics as { name?: { full: string } }).name?.full || patientId;
  const age = getAge((clinicalData.patient_demographics as { birthDate?: string }).birthDate || '1960-01-01');
  const gender = (clinicalData.patient_demographics as { gender?: string }).gender || 'patient';

  return {
    header: {
      patient_id: patientId,
      procedure_code: procedureCode,
      diagnosis_codes: diagnosisCodes,
      payer,
      urgency,
      date_of_service: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    medical_necessity: `${patientName} is a ${age}-year-old ${gender} presenting with ${diagnosisCodes.join(', ')} that has proven refractory to comprehensive conservative management.\n\nThe patient completed structured physical therapy with documented minimal improvement in functional status. NSAID therapy has provided inadequate pain relief, with current pain severity rated at 7/10.\n\nMRI demonstrates significant structural damage confirming the basis for surgical intervention. The patient has been medically cleared for surgery with well-controlled comorbidities.\n\nBased on the documented failure of conservative treatment, confirmatory imaging findings, and functional impairment, ${proc.name} (CPT ${procedureCode}) is medically necessary to restore mobility and quality of life.`,
    supporting_evidence: [
      { type: 'active_conditions', finding: `${clinicalData.conditions.length} active conditions documented` },
      { type: 'current_medications', finding: `${clinicalData.medications.length} current medications including NSAID therapy` },
      { type: 'procedure_history', finding: `${clinicalData.procedures.length} prior procedures: PT evaluation and imaging` },
      { type: 'clinical_evaluation', finding: 'Pain 7/10, BMI 29.1, HbA1c 7.1% - medically cleared for surgery' },
    ],
    policy_compliance: {
      criteria_met: policyAnalysis.coverage_criteria.map(c => `${c} ✓`),
      documentation_attached: policyAnalysis.documentation_requirements,
    },
  };
}

function generateComplianceChecks(urgency: string, policyAnalysis: PolicyAnalysis): ComplianceChecks {
  const confidence = policyAnalysis.coverage_probability;
  const hitlRequired = confidence < 0.7;

  return {
    is_valid: !hitlRequired,
    checks_passed: [
      'Required fields populated',
      'Clinical data available',
      'Policy match found',
      'Conservative treatment documented',
      'Imaging report available',
    ],
    checks_failed: hitlRequired ? ['Coverage probability below threshold'] : [],
    confidence_score: confidence,
    hitl_required: hitlRequired,
    timeline_compliant: true,
    deadline: urgency === 'expedited'
      ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export interface DemoAgentResult {
  clinical_data: ClinicalData;
  policy_analysis: PolicyAnalysis;
  pa_packet: PAPacket;
  compliance_checks: ComplianceChecks;
  execution_log: ExecutionLogEntry[];
  final_status: string;
}

/**
 * Runs the full 5-agent simulation pipeline.
 * Returns the complete result that can be merged into a PARequest.
 */
export function runDemoAgentPipeline(pa: Pick<PARequest, 'pa_id' | 'patient_id' | 'procedure_code' | 'diagnosis_codes' | 'urgency' | 'payer'>): DemoAgentResult {
  const executionLog: ExecutionLogEntry[] = [];
  const baseTime = Date.now();

  // Step 1: Clinical Data Gathering
  const clinicalData = generateClinicalData(pa.patient_id, pa.procedure_code, pa.diagnosis_codes);
  executionLog.push({
    step: 'clinical_data_gathering',
    status: 'completed',
    agent: 'ClinicalDataGatherer',
    result_summary: `Found ${clinicalData.conditions.length} conditions, ${clinicalData.medications.length} medications, ${clinicalData.observations.length} observations`,
    timestamp: new Date(baseTime + 1200).toISOString(),
    esql_queries: [
      `FROM healthsync-conditions\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_conditions = COUNT(*),\n       active = COUNT_DISTINCT(clinicalStatus)`,
      `FROM healthsync-medications\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_medications = COUNT(*)`,
      `FROM healthsync-observations\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_observations = COUNT(*)`,
    ],
  });

  // Step 2: Policy Analysis
  const policyAnalysis = generatePolicyAnalysis(pa.procedure_code, pa.diagnosis_codes, pa.payer);
  executionLog.push({
    step: 'policy_analysis',
    status: 'completed',
    agent: 'PolicyAnalyzer',
    result_summary: `Matched ${policyAnalysis.matched_policies.length} policies, coverage probability: ${policyAnalysis.coverage_probability}`,
    timestamp: new Date(baseTime + 4400).toISOString(),
    esql_queries: [
      `FROM healthsync-policies\n| WHERE payer == "${pa.payer}"\n| STATS total_policies = COUNT(*),\n       procedure_count = COUNT_DISTINCT(procedure_codes)`,
    ],
  });

  // Step 3: Documentation Assembly
  const paPacket = generatePAPacket(pa.patient_id, pa.procedure_code, pa.diagnosis_codes, pa.payer, pa.urgency, clinicalData, policyAnalysis);
  executionLog.push({
    step: 'documentation_assembly',
    status: 'completed',
    agent: 'DocumentationAssembler',
    result_summary: 'PA packet generated with medical necessity narrative',
    timestamp: new Date(baseTime + 7500).toISOString(),
  });

  // Step 4: Compliance Validation
  const complianceChecks = generateComplianceChecks(pa.urgency, policyAnalysis);
  executionLog.push({
    step: 'compliance_validation',
    status: 'completed',
    agent: 'ComplianceValidator',
    result_summary: `${complianceChecks.checks_passed.length} passed, ${complianceChecks.checks_failed.length} failed, confidence: ${Math.round(complianceChecks.confidence_score * 100)}%`,
    timestamp: new Date(baseTime + 8300).toISOString(),
    esql_queries: [
      `FROM healthsync-pa-requests\n| WHERE pa_id == "${pa.pa_id}"\n| STATS compliance_score = AVG(compliance_score)`,
    ],
  });

  const finalStatus = complianceChecks.hitl_required ? 'hitl_required' : 'ready_for_review';

  return {
    clinical_data: clinicalData,
    policy_analysis: policyAnalysis,
    pa_packet: paPacket,
    compliance_checks: complianceChecks,
    execution_log: executionLog,
    final_status: finalStatus,
  };
}
