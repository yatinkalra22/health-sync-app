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

    const demographics = await this.getPatientDemographics(patient_id);
    const conditions = await this.getPatientConditions(patient_id);
    const medications = await this.getPatientMedications(patient_id);
    const procedures = await this.getPatientProcedures(patient_id);
    const observations = await this.getPatientObservations(patient_id);

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
