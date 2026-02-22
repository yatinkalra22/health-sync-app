export type PAStatus =
  | 'submitted'
  | 'processing'
  | 'ready_for_review'
  | 'hitl_required'
  | 'approved'
  | 'denied'
  | 'failed';

export type PAUrgency = 'standard' | 'expedited';

export interface PARequest {
  pa_id: string;
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  urgency: PAUrgency;
  payer: string;
  status: PAStatus;
  created_at: string;
  updated_at: string;
  clinician_id?: string;
  notes?: string;
  clinical_data?: ClinicalData;
  policy_analysis?: PolicyAnalysis;
  pa_packet?: PAPacket;
  compliance_checks?: ComplianceChecks;
  execution_log?: ExecutionLogEntry[];
}

export interface PARequestCreate {
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  urgency?: PAUrgency;
  payer?: string;
  clinician_id?: string;
  notes?: string;
}

export interface ClinicalData {
  patient_demographics: PatientDemographics;
  conditions: Condition[];
  medications: Medication[];
  procedures: Procedure[];
  observations: Observation[];
  clinical_summary: string;
  complexity_score: number;
}

export interface PatientDemographics {
  patient_id: string;
  name?: {
    family: string;
    given: string[];
    full: string;
  };
  birthDate?: string;
  gender?: string;
  address?: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export interface Condition {
  condition_id: string;
  patient_id: string;
  code?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  severity?: string;
  onsetDateTime?: string;
  recordedDate?: string;
  clinicalStatus?: string;
}

export interface Medication {
  medication_id: string;
  patient_id: string;
  medicationCodeableConcept?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  authoredOn?: string;
  status?: string;
}

export interface Procedure {
  procedure_id: string;
  patient_id: string;
  code?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  performedDateTime?: string;
  status?: string;
}

export interface Observation {
  observation_id: string;
  patient_id: string;
  code?: {
    coding?: Array<{ system: string; code: string; display: string }>;
    text?: string;
  };
  valueQuantity?: {
    value: number;
    unit: string;
  };
  effectiveDateTime?: string;
  status?: string;
}

export interface PolicyAnalysis {
  matched_policies: MatchedPolicy[];
  coverage_criteria: string[];
  documentation_requirements: string[];
  coverage_probability: number;
  policy_analysis: string;
}

export interface MatchedPolicy {
  policy_id: string;
  payer: string;
  policy_name: string;
  policy_text: string;
  procedure_codes: string[];
  diagnosis_codes: string[];
  coverage_criteria: string[];
  documentation_requirements: string[];
}

export interface PAPacket {
  header: {
    patient_id: string;
    procedure_code: string;
    diagnosis_codes?: string[];
    payer: string;
    urgency: string;
    date_of_service?: string;
  };
  medical_necessity: string;
  supporting_evidence?: Array<{
    type: string;
    finding: string;
  }>;
  policy_compliance: {
    criteria_met?: string[];
    documentation_attached?: string[];
  };
  clinical_evidence?: ClinicalData;
}

export interface ComplianceChecks {
  is_valid: boolean;
  checks_passed: string[];
  checks_failed: string[];
  confidence_score: number;
  hitl_required?: boolean;
  timeline_compliant?: boolean;
  deadline?: string;
}

export interface ExecutionLogEntry {
  step: string;
  status: 'started' | 'completed' | 'failed';
  agent?: string;
  result_summary?: string;
  error?: string;
  timestamp?: string;
  esql_queries?: string[];
}
