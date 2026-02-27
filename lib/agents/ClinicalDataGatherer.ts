import { BaseAgent } from './BaseAgent';
import { Client } from '@elastic/elasticsearch';
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { ES_INDICES } from '@/lib/constants';
import { esqlQuery } from '@/lib/services/elasticsearch';

interface ClinicalContext {
  patient_id: string;
  procedure_code?: string;
  diagnosis_codes?: string[];
}

interface ClinicalData {
  patient_demographics: Record<string, unknown>;
  conditions: Record<string, unknown>[];
  medications: Record<string, unknown>[];
  procedures: Record<string, unknown>[];
  observations: Record<string, unknown>[];
  clinical_summary: string;
  complexity_score: number;
}

export class ClinicalDataGatherer extends BaseAgent {
  private es: Client | null;

  constructor(esClient: Client | null) {
    super(
      'ClinicalDataGatherer',
      'You are a clinical data expert who retrieves and analyzes FHIR patient data for prior authorization decisions.'
    );
    this.es = esClient;
  }

  async execute(context: ClinicalContext): Promise<ClinicalData> {
    const { patient_id } = context;
    this.log('Gathering clinical data for patient:', patient_id);

    // Use ES|QL to get a cross-index patient profile summary
    const esqlProfile = await this.getPatientProfileESQL(patient_id);
    this.log('ES|QL patient profile:', esqlProfile);

    let demographics = await this.getPatientDemographics(patient_id);
    let conditions = await this.getPatientConditions(patient_id);
    let medications = await this.getPatientMedications(patient_id);
    let procedures = await this.getPatientProcedures(patient_id);
    let observations = await this.getPatientObservations(patient_id);

    // If no clinical data found in ES, generate and index realistic sample data
    const hasData = conditions.length > 0 || medications.length > 0;
    if (!hasData && this.es) {
      this.log('No clinical data found — generating sample data for patient:', patient_id);
      const sample = await this.generateSampleClinicalData(patient_id, context.procedure_code, context.diagnosis_codes);
      await this.indexSampleData(patient_id, sample);
      demographics = sample.demographics;
      conditions = sample.conditions;
      medications = sample.medications;
      procedures = sample.procedures;
      observations = sample.observations;
    }

    const complexityScore = this.calculateComplexityScore({
      conditions,
      medications,
      procedures,
    });

    const clinicalSummary = await this.generateClinicalSummary({
      demographics,
      conditions,
      medications,
      procedures,
    });

    return {
      patient_demographics: demographics,
      conditions,
      medications,
      procedures,
      observations,
      clinical_summary: clinicalSummary,
      complexity_score: complexityScore,
    };
  }

  /**
   * ES|QL query to get a cross-index patient clinical profile summary.
   * Uses ES|QL STATS aggregation to count resources across indices.
   */
  private async getPatientProfileESQL(patientId: string) {
    try {
      const [conditionStats, medicationStats, observationStats] = await Promise.all([
        esqlQuery(`
          FROM ${ES_INDICES.CONDITIONS}
          | WHERE patient_id == "${patientId}"
          | STATS total_conditions = COUNT(*), active_conditions = COUNT_DISTINCT(clinicalStatus)
        `),
        esqlQuery(`
          FROM ${ES_INDICES.MEDICATIONS}
          | WHERE patient_id == "${patientId}"
          | STATS total_medications = COUNT(*)
        `),
        esqlQuery(`
          FROM ${ES_INDICES.OBSERVATIONS}
          | WHERE patient_id == "${patientId}"
          | STATS total_observations = COUNT(*)
        `),
      ]);

      return {
        conditions: conditionStats[0] || {},
        medications: medicationStats[0] || {},
        observations: observationStats[0] || {},
      };
    } catch {
      this.log('ES|QL profile query unavailable, using standard search');
      return null;
    }
  }

  private async searchIndex(index: string, patientId: string, sortField?: string, size = 50) {
    if (!this.es) return [];

    const params: SearchRequest = {
      index,
      query: { term: { 'patient_id': patientId } },
      size,
    };

    if (sortField) {
      params.sort = [{ [sortField]: { order: 'desc' } }];
    }

    const result = await this.es.search(params);
    return result.hits.hits.map((hit) => hit._source as Record<string, unknown>);
  }

  private async getPatientDemographics(patientId: string) {
    if (!this.es) return { patient_id: patientId };

    const result = await this.es.search({
      index: ES_INDICES.PATIENTS,
      query: { term: { patient_id: patientId } },
    } as SearchRequest);

    return (result.hits.hits[0]?._source as Record<string, unknown>) || { patient_id: patientId };
  }

  private async getPatientConditions(patientId: string) {
    return this.searchIndex(ES_INDICES.CONDITIONS, patientId, 'recordedDate');
  }

  private async getPatientMedications(patientId: string) {
    return this.searchIndex(ES_INDICES.MEDICATIONS, patientId, 'authoredOn');
  }

  private async getPatientProcedures(patientId: string) {
    return this.searchIndex(ES_INDICES.PROCEDURES, patientId, 'performedDateTime');
  }

  private async getPatientObservations(patientId: string) {
    return this.searchIndex(ES_INDICES.OBSERVATIONS, patientId, 'effectiveDateTime', 100);
  }

  /**
   * Use Gemini AI to generate realistic random clinical data for a patient.
   */
  private async generateSampleClinicalData(
    patientId: string,
    procedureCode?: string,
    diagnosisCodes?: string[]
  ) {
    const prompt = `Generate realistic FHIR-style clinical data for a random patient who needs prior authorization.

Patient ID: ${patientId}
Procedure code: ${procedureCode || 'unknown'}
Diagnosis codes: ${diagnosisCodes?.join(', ') || 'unknown'}

Generate a COMPLETELY RANDOM patient — random name, random age (40-85), random gender, random US city.
Make the clinical history realistic and relevant to the procedure. Include comorbidities.

Return ONLY valid JSON (no markdown, no backticks):
{
  "demographics": {
    "patient_id": "${patientId}",
    "name": { "family": "LastName", "given": ["FirstName"], "full": "FirstName LastName" },
    "birthDate": "YYYY-MM-DD",
    "gender": "male or female",
    "address": { "city": "City", "state": "ST", "postalCode": "12345" }
  },
  "conditions": [
    { "condition_id": "C-${patientId}-1", "patient_id": "${patientId}", "code": { "text": "condition name" }, "clinicalStatus": "active", "onsetDateTime": "YYYY-MM-DD", "recordedDate": "YYYY-MM-DD" }
  ],
  "medications": [
    { "medication_id": "M-${patientId}-1", "patient_id": "${patientId}", "medicationCodeableConcept": { "text": "medication name and dose" }, "status": "active", "authoredOn": "YYYY-MM-DD" }
  ],
  "procedures": [
    { "procedure_id": "P-${patientId}-1", "patient_id": "${patientId}", "code": { "text": "procedure name" }, "status": "completed", "performedDateTime": "YYYY-MM-DD" }
  ],
  "observations": [
    { "observation_id": "O-${patientId}-1", "patient_id": "${patientId}", "code": { "text": "observation name" }, "valueQuantity": { "value": 7, "unit": "/10" }, "effectiveDateTime": "YYYY-MM-DD", "status": "final" }
  ]
}

Generate 3-5 conditions, 3-4 medications, 2-3 prior procedures, and 3-4 observations (pain, BMI, vitals, labs).
Make it clinically realistic for someone who needs CPT ${procedureCode || 'this procedure'}.`;

    const response = await this.callLLM([{ role: 'user', content: prompt }],
      'You are a medical data generator. Return ONLY valid JSON, no markdown.', 2000);

    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleaned);
      return {
        demographics: data.demographics || { patient_id: patientId },
        conditions: data.conditions || [],
        medications: data.medications || [],
        procedures: data.procedures || [],
        observations: data.observations || [],
      };
    } catch {
      this.log('Failed to parse Gemini response, using fallback');
      return this.getFallbackData(patientId, procedureCode, diagnosisCodes);
    }
  }

  /**
   * Minimal fallback if Gemini fails to return valid JSON.
   */
  private getFallbackData(patientId: string, procedureCode?: string, diagnosisCodes?: string[]) {
    const now = new Date();
    return {
      demographics: {
        patient_id: patientId,
        name: { family: 'Smith', given: ['Alex'], full: 'Alex Smith' },
        birthDate: '1962-05-14',
        gender: 'male',
        address: { city: 'Chicago', state: 'IL', postalCode: '60601' },
      },
      conditions: [
        { condition_id: `C-${patientId}-1`, patient_id: patientId, code: { text: 'Primary condition for CPT ' + (procedureCode || 'unknown'), coding: diagnosisCodes?.[0] ? [{ code: diagnosisCodes[0] }] : [] }, clinicalStatus: 'active', onsetDateTime: new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0], recordedDate: new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0] },
        { condition_id: `C-${patientId}-2`, patient_id: patientId, code: { text: 'Essential hypertension' }, clinicalStatus: 'active', onsetDateTime: new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0], recordedDate: new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0] },
      ],
      medications: [
        { medication_id: `M-${patientId}-1`, patient_id: patientId, medicationCodeableConcept: { text: 'Ibuprofen 400mg' }, status: 'active', authoredOn: new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0] },
      ],
      procedures: [
        { procedure_id: `P-${patientId}-1`, patient_id: patientId, code: { text: 'Initial consultation' }, status: 'completed', performedDateTime: new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0] },
      ],
      observations: [
        { observation_id: `O-${patientId}-1`, patient_id: patientId, code: { text: 'Pain severity' }, valueQuantity: { value: 7, unit: '/10' }, effectiveDateTime: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0], status: 'final' },
        { observation_id: `O-${patientId}-2`, patient_id: patientId, code: { text: 'BMI' }, valueQuantity: { value: 28.3, unit: 'kg/m2' }, effectiveDateTime: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0], status: 'final' },
      ],
    };
  }

  /**
   * Index generated sample data into Elasticsearch.
   */
  private async indexSampleData(
    patientId: string,
    data: {
      demographics: Record<string, unknown>;
      conditions: Record<string, unknown>[];
      medications: Record<string, unknown>[];
      procedures: Record<string, unknown>[];
      observations: Record<string, unknown>[];
    }
  ) {
    if (!this.es) return;

    try {
      const ops: Array<{ index: string; id: string; document: Record<string, unknown> }> = [];

      ops.push({ index: ES_INDICES.PATIENTS, id: patientId, document: data.demographics });

      for (const c of data.conditions) {
        ops.push({ index: ES_INDICES.CONDITIONS, id: c.condition_id as string, document: c });
      }
      for (const m of data.medications) {
        ops.push({ index: ES_INDICES.MEDICATIONS, id: m.medication_id as string, document: m });
      }
      for (const p of data.procedures) {
        ops.push({ index: ES_INDICES.PROCEDURES, id: p.procedure_id as string, document: p });
      }
      for (const o of data.observations) {
        ops.push({ index: ES_INDICES.OBSERVATIONS, id: o.observation_id as string, document: o });
      }

      // Bulk index
      const body = ops.flatMap(op => [
        { index: { _index: op.index, _id: op.id } },
        op.document,
      ]);
      await this.es.bulk({ body, refresh: true });
      this.log(`Indexed ${ops.length} sample documents for patient ${patientId}`);
    } catch (err) {
      this.log('Failed to index sample data:', err);
    }
  }

  private calculateComplexityScore(data: {
    conditions: unknown[];
    medications: unknown[];
    procedures: unknown[];
  }): number {
    const score = Math.min(
      (data.conditions.length * 0.3 + data.medications.length * 0.2 + data.procedures.length * 0.5) / 20,
      1.0
    );
    return Math.round(score * 100) / 100;
  }

  private async generateClinicalSummary(data: {
    demographics: Record<string, unknown>;
    conditions: Record<string, unknown>[];
    medications: Record<string, unknown>[];
    procedures: Record<string, unknown>[];
  }): Promise<string> {
    const age = this.calculateAge(data.demographics.birthDate as string);
    const gender = (data.demographics.gender as string) || 'unknown';

    const conditionNames = data.conditions
      .slice(0, 5)
      .map((c) => (c.code as Record<string, unknown>)?.text || 'Unknown condition');

    const medicationNames = data.medications
      .slice(0, 5)
      .map((m) => (m.medicationCodeableConcept as Record<string, unknown>)?.text || 'Unknown medication');

    const prompt = `Generate a brief clinical summary (3-4 sentences) for a prior authorization request.

Patient: ${age} year old ${gender}

Active Conditions:
${conditionNames.map((c) => `- ${c}`).join('\n')}

Current Medications:
${medicationNames.map((m) => `- ${m}`).join('\n')}

Provide a concise, professional summary focusing on clinically relevant information.`;

    return this.callLLM([{ role: 'user', content: prompt }], undefined, 500);
  }

  private calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const born = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    const monthDiff = today.getMonth() - born.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
      age--;
    }
    return age;
  }
}
