/**
 * Simulates the 5-agent PA processing pipeline in mock mode.
 * Uses Gemini to generate diverse, unique clinical scenarios each time.
 * Falls back to local randomised data when no API key is configured.
 */

import type {
  PARequest,
  ClinicalData,
  PolicyAnalysis,
  PAPacket,
  ComplianceChecks,
  ExecutionLogEntry,
} from '@/lib/types/pa';
import { callLLM } from '@/lib/services/llm';

// ─── Procedure reference data (used in prompts & fallback) ───────────────────

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

// ─── Gemini-powered generation ───────────────────────────────────────────────

async function generateWithGemini(
  procedureCode: string,
  diagnosisCodes: string[],
  payer: string,
  urgency: string,
): Promise<{
  clinical_data: ClinicalData;
  policy_analysis: PolicyAnalysis;
  pa_packet: PAPacket;
  compliance_checks: ComplianceChecks;
} | null> {
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];
  const patientId = `P-${Date.now()}`;

  const prompt = `You are a medical data generator for a Prior Authorization system demo.

Generate a COMPLETELY UNIQUE patient case for a ${proc.name} (CPT ${procedureCode}).
Diagnosis codes: ${diagnosisCodes.join(', ')}
Payer: ${payer}
Urgency: ${urgency}

IMPORTANT RULES FOR DIVERSITY:
- Generate a RANDOM patient with a unique first and last name (vary gender, ethnicity, age between 28-85)
- Randomize the birth date, city, state
- Create 3-6 VARIED medical conditions relevant to this procedure (do NOT always use osteoarthritis + hypertension + diabetes)
- Create 2-5 medications that match the conditions (vary the drugs, dosages)
- Create 2-4 prior procedures relevant to the surgical path
- Create 3-5 clinical observations with VARIED values (pain 3-9/10, BMI 20-38, different lab values)
- Generate a REALISTIC complexity score between 0.35 and 0.95
- Generate a coverage probability between 0.55 and 0.98 (NOT always the same value)
- Vary the number of criteria met vs not met
- Some cases should have missing documentation or failed checks
- Make the medical necessity narrative unique and specific to THIS patient

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "patient": {
    "name": { "family": "LastName", "given": ["First", "M"], "full": "First M LastName" },
    "birthDate": "YYYY-MM-DD",
    "gender": "male|female",
    "address": { "city": "CityName", "state": "XX", "postalCode": "XXXXX" }
  },
  "conditions": [
    { "text": "Condition description", "status": "active", "onset": "YYYY-MM-DD" }
  ],
  "medications": [
    { "text": "Drug name and dosage", "status": "active", "date": "YYYY-MM-DD" }
  ],
  "procedures": [
    { "text": "Procedure description", "status": "completed", "date": "YYYY-MM-DD" }
  ],
  "observations": [
    { "text": "Observation name", "value": 7, "unit": "/10", "date": "YYYY-MM-DD" }
  ],
  "clinical_summary": "3-4 sentence clinical summary specific to this patient",
  "complexity_score": 0.65,
  "coverage_probability": 0.85,
  "criteria_met_count": 3,
  "criteria_total": 4,
  "checks_failed": ["list of any failed compliance checks or empty array"],
  "medical_necessity": "3-5 paragraph medical necessity narrative unique to this patient",
  "policy_analysis_narrative": "2-3 sentence policy analysis"
}`;

  try {
    const raw = await callLLM(
      [{ role: 'user', content: prompt }],
      'You are a medical data generator. Return ONLY valid JSON. No markdown fences. No extra text.',
      3000,
    );

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(cleaned);

    const ts = Date.now();

    const clinical_data: ClinicalData = {
      patient_demographics: {
        patient_id: patientId,
        name: data.patient.name,
        birthDate: data.patient.birthDate,
        gender: data.patient.gender,
        address: data.patient.address,
      },
      conditions: (data.conditions || []).map((c: { text: string; status: string; onset: string }, i: number) => ({
        condition_id: `C-${ts}-${i}`,
        patient_id: patientId,
        code: { text: c.text },
        clinicalStatus: c.status,
        onsetDateTime: c.onset,
      })),
      medications: (data.medications || []).map((m: { text: string; status: string; date: string }, i: number) => ({
        medication_id: `M-${ts}-${i}`,
        patient_id: patientId,
        medicationCodeableConcept: { text: m.text },
        status: m.status,
        authoredOn: m.date,
      })),
      procedures: (data.procedures || []).map((p: { text: string; status: string; date: string }, i: number) => ({
        procedure_id: `P-${ts}-${i}`,
        patient_id: patientId,
        code: { text: p.text },
        status: p.status,
        performedDateTime: p.date,
      })),
      observations: (data.observations || []).map((o: { text: string; value: number; unit: string; date: string }, i: number) => ({
        observation_id: `O-${ts}-${i}`,
        patient_id: patientId,
        code: { text: o.text },
        valueQuantity: { value: o.value, unit: o.unit },
        effectiveDateTime: o.date,
        status: 'final',
      })),
      clinical_summary: data.clinical_summary,
      complexity_score: data.complexity_score ?? 0.65,
    };

    const coverageProbability = data.coverage_probability ?? 0.82;
    const criteriaMet = data.criteria_met_count ?? proc.criteria.length - 1;
    const criteriaTotal = data.criteria_total ?? proc.criteria.length;

    const policy_analysis: PolicyAnalysis = {
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
      coverage_probability: coverageProbability,
      policy_analysis: data.policy_analysis_narrative || `Patient meets ${criteriaMet} of ${criteriaTotal} major coverage criteria for ${proc.name} under ${payer}.`,
    };

    const patientName = data.patient.name.full;
    const age = getAge(data.patient.birthDate);
    const gender = data.patient.gender;

    const pa_packet: PAPacket = {
      header: {
        patient_id: patientId,
        procedure_code: procedureCode,
        diagnosis_codes: diagnosisCodes,
        payer,
        urgency,
        date_of_service: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      medical_necessity: data.medical_necessity || `${patientName} is a ${age}-year-old ${gender} requiring ${proc.name}.`,
      supporting_evidence: [
        { type: 'active_conditions', finding: `${clinical_data.conditions.length} active conditions documented` },
        { type: 'current_medications', finding: `${clinical_data.medications.length} current medications` },
        { type: 'procedure_history', finding: `${clinical_data.procedures.length} prior procedures documented` },
        { type: 'clinical_observations', finding: `${clinical_data.observations.length} clinical observations recorded` },
      ],
      policy_compliance: {
        criteria_met: proc.criteria.slice(0, criteriaMet).map(c => `${c} ✓`),
        documentation_attached: proc.docs,
      },
    };

    const failedChecks: string[] = data.checks_failed || [];
    const confidence = coverageProbability;
    const hitlRequired = confidence < 0.7 || failedChecks.length > 1;

    const compliance_checks: ComplianceChecks = {
      is_valid: !hitlRequired,
      checks_passed: [
        'Required fields populated',
        'Clinical data available',
        'Policy match found',
        ...(failedChecks.length === 0 ? ['Conservative treatment documented', 'Imaging report available'] : []),
      ],
      checks_failed: failedChecks,
      confidence_score: confidence,
      hitl_required: hitlRequired,
      timeline_compliant: true,
      deadline: urgency === 'expedited'
        ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return { clinical_data, policy_analysis, pa_packet, compliance_checks };
  } catch (error) {
    console.warn('[demo-agent-runner] Gemini generation failed, using local fallback:', error);
    return null;
  }
}

// ─── Local random fallback (no API key) ──────────────────────────────────────

const RANDOM_NAMES = [
  { family: 'Rodriguez', given: ['Maria', 'L'], full: 'Maria L Rodriguez', gender: 'female' },
  { family: 'Chen', given: ['Wei', 'J'], full: 'Wei J Chen', gender: 'male' },
  { family: 'Okafor', given: ['Adaeze', 'N'], full: 'Adaeze N Okafor', gender: 'female' },
  { family: 'Patel', given: ['Rajesh', 'K'], full: 'Rajesh K Patel', gender: 'male' },
  { family: 'Williams', given: ['Denise', 'M'], full: 'Denise M Williams', gender: 'female' },
  { family: 'Johansson', given: ['Erik', 'A'], full: 'Erik A Johansson', gender: 'male' },
  { family: 'Nakamura', given: ['Yuki'], full: 'Yuki Nakamura', gender: 'female' },
  { family: 'Thompson', given: ['Marcus', 'D'], full: 'Marcus D Thompson', gender: 'male' },
  { family: 'Kim', given: ['Soo-Jin'], full: 'Soo-Jin Kim', gender: 'female' },
  { family: 'Abadi', given: ['Hassan', 'R'], full: 'Hassan R Abadi', gender: 'male' },
  { family: 'Morales', given: ['Isabella', 'C'], full: 'Isabella C Morales', gender: 'female' },
  { family: 'O\'Brien', given: ['Patrick', 'S'], full: 'Patrick S O\'Brien', gender: 'male' },
  { family: 'Gupta', given: ['Priya'], full: 'Priya Gupta', gender: 'female' },
  { family: 'Jackson', given: ['Terrence', 'W'], full: 'Terrence W Jackson', gender: 'male' },
  { family: 'Nguyen', given: ['Linh', 'T'], full: 'Linh T Nguyen', gender: 'female' },
];

const RANDOM_CITIES = [
  { city: 'Houston', state: 'TX', postalCode: '77001' },
  { city: 'Phoenix', state: 'AZ', postalCode: '85001' },
  { city: 'Philadelphia', state: 'PA', postalCode: '19101' },
  { city: 'San Diego', state: 'CA', postalCode: '92101' },
  { city: 'Atlanta', state: 'GA', postalCode: '30301' },
  { city: 'Denver', state: 'CO', postalCode: '80201' },
  { city: 'Seattle', state: 'WA', postalCode: '98101' },
  { city: 'Boston', state: 'MA', postalCode: '02101' },
  { city: 'Miami', state: 'FL', postalCode: '33101' },
  { city: 'Minneapolis', state: 'MN', postalCode: '55401' },
  { city: 'Portland', state: 'OR', postalCode: '97201' },
  { city: 'Nashville', state: 'TN', postalCode: '37201' },
];

const CONDITION_POOLS: Record<string, string[][]> = {
  '27447': [
    ['Primary osteoarthritis, right knee', 'Chronic knee pain', 'Obesity'],
    ['Bilateral knee osteoarthritis', 'Rheumatoid arthritis', 'Chronic pain syndrome'],
    ['Degenerative joint disease, left knee', 'Type 2 diabetes', 'Peripheral neuropathy'],
    ['Post-traumatic arthritis, right knee', 'Hypertension', 'Hyperlipidemia'],
    ['Severe tricompartmental osteoarthritis', 'Chronic kidney disease stage 2', 'Iron deficiency anemia'],
  ],
  '29881': [
    ['Medial meniscal tear, right knee', 'Knee joint effusion', 'Patellar tendinitis'],
    ['Lateral meniscal tear, left knee', 'Chondromalacia patella', 'Obesity'],
    ['Complex meniscal tear', 'Anterior cruciate ligament sprain', 'Chronic knee instability'],
  ],
  '29880': [
    ['Bucket-handle meniscal tear', 'Knee locking', 'ACL insufficiency'],
    ['Peripheral meniscal tear, medial', 'Knee joint effusion', 'Baker cyst'],
  ],
  '27130': [
    ['Avascular necrosis of femoral head', 'Chronic hip pain', 'Osteoporosis'],
    ['Primary osteoarthritis, left hip', 'Lumbar radiculopathy', 'GERD'],
    ['Rheumatoid arthritis of hip', 'Anemia of chronic disease', 'Depression'],
    ['Hip dysplasia with secondary arthritis', 'Hypertension', 'Hypothyroidism'],
  ],
  '63030': [
    ['Lumbar disc herniation L4-L5', 'Left-sided sciatica', 'Lumbar spinal stenosis'],
    ['Lumbar disc herniation L5-S1', 'Bilateral radiculopathy', 'Degenerative disc disease'],
    ['Recurrent disc herniation L3-L4', 'Cauda equina compression', 'Chronic low back pain', 'Anxiety disorder'],
  ],
};

const MEDICATION_POOLS = [
  ['Naproxen 500mg BID', 'Gabapentin 300mg TID', 'Acetaminophen 500mg PRN'],
  ['Celecoxib 200mg daily', 'Tramadol 50mg PRN', 'Cyclobenzaprine 10mg QHS'],
  ['Meloxicam 15mg daily', 'Duloxetine 60mg daily', 'Lidocaine patch 5%'],
  ['Diclofenac gel 1% topical', 'Pregabalin 75mg BID', 'Hydrocodone-acetaminophen 5-325 PRN'],
  ['Ibuprofen 600mg TID', 'Tizanidine 4mg PRN', 'Omeprazole 20mg daily'],
  ['Indomethacin 25mg TID', 'Amitriptyline 25mg QHS', 'Methocarbamol 750mg QID'],
];

const OBSERVATION_RANGES = {
  pain: { min: 3, max: 9, unit: '/10', text: 'Pain severity' },
  bmi: { min: 21, max: 37, unit: 'kg/m2', text: 'BMI' },
  hba1c: { min: 5.2, max: 8.4, unit: '%', text: 'HbA1c' },
  bp_systolic: { min: 110, max: 165, unit: 'mmHg', text: 'Blood pressure systolic' },
  creatinine: { min: 0.7, max: 1.8, unit: 'mg/dL', text: 'Serum creatinine' },
  esr: { min: 8, max: 55, unit: 'mm/hr', text: 'ESR' },
  rom: { min: 40, max: 120, unit: 'degrees', text: 'Range of motion' },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number, decimals = 1): number {
  return Number((min + Math.random() * (max - min)).toFixed(decimals));
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
}

function getAge(birthDate: string): number {
  const born = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age;
}

function generateFallbackClinicalData(patientId: string, procedureCode: string, _diagnosisCodes: string[]): ClinicalData {
  const nameEntry = pick(RANDOM_NAMES);
  const address = pick(RANDOM_CITIES);
  const birthDate = randomDate(1942, 1998);
  const age = getAge(birthDate);
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];
  const ts = Date.now();

  const conditionPool = CONDITION_POOLS[procedureCode] || CONDITION_POOLS['27447'];
  const conditionTexts = pick(conditionPool);

  const medicationSet = pick(MEDICATION_POOLS);

  // Pick 3-5 random observations
  const obsKeys = Object.keys(OBSERVATION_RANGES) as (keyof typeof OBSERVATION_RANGES)[];
  const numObs = 3 + Math.floor(Math.random() * 3);
  const selectedObs = obsKeys.sort(() => Math.random() - 0.5).slice(0, numObs);

  const painObs = selectedObs.find(k => k === 'pain');
  const painValue = painObs
    ? randBetween(OBSERVATION_RANGES.pain.min, OBSERVATION_RANGES.pain.max, 0)
    : randBetween(4, 8, 0);

  return {
    patient_demographics: {
      patient_id: patientId,
      name: { family: nameEntry.family, given: nameEntry.given, full: nameEntry.full },
      birthDate,
      gender: nameEntry.gender,
      address,
    },
    conditions: conditionTexts.map((text, i) => ({
      condition_id: `C-${ts}-${i}`,
      patient_id: patientId,
      code: { text },
      clinicalStatus: 'active',
      onsetDateTime: randomDate(2020, 2025),
    })),
    medications: medicationSet.map((text, i) => ({
      medication_id: `M-${ts}-${i}`,
      patient_id: patientId,
      medicationCodeableConcept: { text },
      status: 'active',
      authoredOn: randomDate(2023, 2025),
    })),
    procedures: [
      { procedure_id: `P-${ts}-0`, patient_id: patientId, code: { text: 'Physical therapy evaluation' }, status: 'completed', performedDateTime: randomDate(2024, 2025) },
      { procedure_id: `P-${ts}-1`, patient_id: patientId, code: { text: `${proc.name.includes('Knee') ? 'Knee' : proc.name.includes('Hip') ? 'Hip' : 'Lumbar'} MRI` }, status: 'completed', performedDateTime: randomDate(2024, 2025) },
      ...(Math.random() > 0.5 ? [{ procedure_id: `P-${ts}-2`, patient_id: patientId, code: { text: 'Corticosteroid injection' }, status: 'completed', performedDateTime: randomDate(2024, 2025) }] : []),
    ],
    observations: selectedObs.map((key, i) => {
      const range = OBSERVATION_RANGES[key];
      return {
        observation_id: `O-${ts}-${i}`,
        patient_id: patientId,
        code: { text: range.text },
        valueQuantity: { value: randBetween(range.min, range.max), unit: range.unit },
        effectiveDateTime: randomDate(2025, 2026),
        status: 'final' as const,
      };
    }),
    clinical_summary: `${nameEntry.full} is a ${age}-year-old ${nameEntry.gender} presenting with ${conditionTexts[0]} requiring ${proc.name}. Patient has completed conservative treatment including physical therapy and medication management with inadequate relief. Current pain severity rated at ${painValue}/10. ${conditionTexts.length > 1 ? `Comorbidities include ${conditionTexts.slice(1).join(' and ')}.` : ''} Imaging confirms structural pathology supporting surgical intervention.`,
    complexity_score: randBetween(0.35, 0.92),
  };
}

function generateFallbackPolicyAnalysis(procedureCode: string, diagnosisCodes: string[], payer: string): PolicyAnalysis {
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];
  const probability = randBetween(0.55, 0.97);
  const criteriaMet = Math.max(1, Math.floor(proc.criteria.length * probability));

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
    coverage_probability: probability,
    policy_analysis: `Patient meets ${criteriaMet} of ${proc.criteria.length} major coverage criteria for ${proc.name} under ${payer}. ${probability > 0.8 ? 'Strong documentation supports medical necessity.' : probability > 0.65 ? 'Additional documentation may strengthen the case.' : 'Significant gaps in documentation require attention before submission.'}`,
  };
}

function generateFallbackPAPacket(
  patientId: string,
  procedureCode: string,
  diagnosisCodes: string[],
  payer: string,
  urgency: string,
  clinicalData: ClinicalData,
  policyAnalysis: PolicyAnalysis,
): PAPacket {
  const proc = PROCEDURE_DETAILS[procedureCode] || PROCEDURE_DETAILS['27447'];
  const demographics = clinicalData.patient_demographics;
  const patientName = demographics.name?.full || patientId;
  const age = getAge(demographics.birthDate || '1960-01-01');
  const gender = demographics.gender || 'patient';

  return {
    header: {
      patient_id: patientId,
      procedure_code: procedureCode,
      diagnosis_codes: diagnosisCodes,
      payer,
      urgency,
      date_of_service: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    medical_necessity: `${patientName} is a ${age}-year-old ${gender} presenting with ${clinicalData.conditions[0]?.code?.text || diagnosisCodes[0]} that has proven refractory to comprehensive conservative management.\n\nThe patient completed structured physical therapy with documented minimal improvement in functional status. Pharmacological treatment has provided inadequate pain relief.\n\n${clinicalData.observations.length > 0 ? `Clinical evaluation reveals ${clinicalData.observations.map(o => `${o.code?.text}: ${o.valueQuantity?.value} ${o.valueQuantity?.unit}`).join(', ')}.` : ''}\n\nBased on the documented failure of conservative treatment, confirmatory imaging findings, and functional impairment, ${proc.name} (CPT ${procedureCode}) is medically necessary to restore mobility and quality of life.`,
    supporting_evidence: [
      { type: 'active_conditions', finding: `${clinicalData.conditions.length} active conditions documented` },
      { type: 'current_medications', finding: `${clinicalData.medications.length} current medications` },
      { type: 'procedure_history', finding: `${clinicalData.procedures.length} prior procedures documented` },
      { type: 'clinical_observations', finding: `${clinicalData.observations.length} clinical observations recorded` },
    ],
    policy_compliance: {
      criteria_met: policyAnalysis.coverage_criteria.slice(0, Math.ceil(policyAnalysis.coverage_criteria.length * policyAnalysis.coverage_probability)).map(c => `${c} ✓`),
      documentation_attached: policyAnalysis.documentation_requirements,
    },
  };
}

function generateFallbackComplianceChecks(urgency: string, policyAnalysis: PolicyAnalysis, complexityScore: number): ComplianceChecks {
  const confidence = policyAnalysis.coverage_probability;
  const hitlRequired = confidence < 0.7 || complexityScore > 0.85;

  const basePassed = ['Required fields populated', 'Clinical data available', 'Policy match found'];
  const baseFailed: string[] = [];

  if (confidence > 0.75) basePassed.push('Conservative treatment documented');
  else baseFailed.push('Conservative treatment documentation incomplete');

  if (confidence > 0.65) basePassed.push('Imaging report available');
  else baseFailed.push('Imaging report missing or outdated');

  if (Math.random() > 0.7) baseFailed.push('Specialist referral letter not found');

  return {
    is_valid: !hitlRequired,
    checks_passed: basePassed,
    checks_failed: baseFailed,
    confidence_score: confidence,
    hitl_required: hitlRequired,
    timeline_compliant: true,
    deadline: urgency === 'expedited'
      ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

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
 * Tries Gemini first for unique, AI-generated cases.
 * Falls back to local randomised data when Gemini is unavailable.
 */
export async function runDemoAgentPipeline(
  pa: Pick<PARequest, 'pa_id' | 'patient_id' | 'procedure_code' | 'diagnosis_codes' | 'urgency' | 'payer'>,
): Promise<DemoAgentResult> {
  const executionLog: ExecutionLogEntry[] = [];
  const baseTime = Date.now();

  // Try Gemini first
  const geminiResult = await generateWithGemini(
    pa.procedure_code,
    pa.diagnosis_codes,
    pa.payer,
    pa.urgency,
  );

  let clinical_data: ClinicalData;
  let policy_analysis: PolicyAnalysis;
  let pa_packet: PAPacket;
  let compliance_checks: ComplianceChecks;

  if (geminiResult) {
    // Use Gemini-generated data
    clinical_data = geminiResult.clinical_data;
    policy_analysis = geminiResult.policy_analysis;
    pa_packet = geminiResult.pa_packet;
    compliance_checks = geminiResult.compliance_checks;
  } else {
    // Fallback to local random generation
    clinical_data = generateFallbackClinicalData(pa.patient_id, pa.procedure_code, pa.diagnosis_codes);
    policy_analysis = generateFallbackPolicyAnalysis(pa.procedure_code, pa.diagnosis_codes, pa.payer);
    pa_packet = generateFallbackPAPacket(pa.patient_id, pa.procedure_code, pa.diagnosis_codes, pa.payer, pa.urgency, clinical_data, policy_analysis);
    compliance_checks = generateFallbackComplianceChecks(pa.urgency, policy_analysis, clinical_data.complexity_score);
  }

  // Step 1: Clinical Data Gathering
  executionLog.push({
    step: 'clinical_data_gathering',
    status: 'completed',
    agent: 'ClinicalDataGatherer',
    result_summary: `Found ${clinical_data.conditions.length} conditions, ${clinical_data.medications.length} medications, ${clinical_data.observations.length} observations`,
    timestamp: new Date(baseTime + 1200).toISOString(),
    esql_queries: [
      `FROM healthsync-conditions\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_conditions = COUNT(*),\n       active = COUNT_DISTINCT(clinicalStatus)`,
      `FROM healthsync-medications\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_medications = COUNT(*)`,
      `FROM healthsync-observations\n| WHERE patient_id == "${pa.patient_id}"\n| STATS total_observations = COUNT(*)`,
    ],
  });

  // Step 2: Policy Analysis
  executionLog.push({
    step: 'policy_analysis',
    status: 'completed',
    agent: 'PolicyAnalyzer',
    result_summary: `Matched ${policy_analysis.matched_policies.length} policies, coverage probability: ${policy_analysis.coverage_probability}`,
    timestamp: new Date(baseTime + 4400).toISOString(),
    esql_queries: [
      `FROM healthsync-policies\n| WHERE payer == "${pa.payer}"\n| STATS total_policies = COUNT(*),\n       procedure_count = COUNT_DISTINCT(procedure_codes)`,
    ],
  });

  // Step 3: Documentation Assembly
  executionLog.push({
    step: 'documentation_assembly',
    status: 'completed',
    agent: 'DocumentationAssembler',
    result_summary: 'PA packet generated with medical necessity narrative',
    timestamp: new Date(baseTime + 7500).toISOString(),
  });

  // Step 4: Compliance Validation
  executionLog.push({
    step: 'compliance_validation',
    status: 'completed',
    agent: 'ComplianceValidator',
    result_summary: `${compliance_checks.checks_passed.length} passed, ${compliance_checks.checks_failed.length} failed, confidence: ${Math.round(compliance_checks.confidence_score * 100)}%`,
    timestamp: new Date(baseTime + 8300).toISOString(),
    esql_queries: [
      `FROM healthsync-pa-requests\n| WHERE pa_id == "${pa.pa_id}"\n| STATS compliance_score = AVG(compliance_score)`,
    ],
  });

  const finalStatus = compliance_checks.hitl_required ? 'hitl_required' : 'ready_for_review';

  return {
    clinical_data,
    policy_analysis,
    pa_packet,
    compliance_checks,
    execution_log: executionLog,
    final_status: finalStatus,
  };
}
