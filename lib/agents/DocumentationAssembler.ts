import { BaseAgent } from './BaseAgent';

interface DocumentationContext {
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  payer: string;
  urgency: string;
  clinical_data: {
    clinical_summary: string;
    patient_demographics: Record<string, unknown>;
    conditions: Record<string, unknown>[];
    medications: Record<string, unknown>[];
    procedures: Record<string, unknown>[];
  };
  policy_analysis: {
    coverage_criteria: string[];
    documentation_requirements: string[];
    coverage_probability: number;
    policy_analysis: string;
  };
}

interface PAPacket {
  header: {
    patient_id: string;
    procedure_code: string;
    diagnosis_codes: string[];
    payer: string;
    urgency: string;
    date_of_service: string;
  };
  medical_necessity: string;
  supporting_evidence: Array<{
    type: string;
    finding: string;
  }>;
  policy_compliance: {
    criteria_met: string[];
    documentation_attached: string[];
  };
  clinical_evidence: unknown;
}

export class DocumentationAssembler extends BaseAgent {
  constructor() {
    super(
      'DocumentationAssembler',
      'You are a medical documentation expert who generates structured prior authorization packets with compelling medical necessity justifications aligned to payer policy criteria.'
    );
  }

  async execute(context: DocumentationContext): Promise<PAPacket> {
    this.log('Assembling PA documentation for patient:', context.patient_id);

    const medicalNecessity = await this.writeMedicalNecessity(context);
    const supportingEvidence = this.gatherSupportingEvidence(context.clinical_data);
    const policyCompliance = this.mapPolicyCompliance(context.policy_analysis);

    return {
      header: {
        patient_id: context.patient_id,
        procedure_code: context.procedure_code,
        diagnosis_codes: context.diagnosis_codes,
        payer: context.payer,
        urgency: context.urgency,
        date_of_service: new Date().toISOString().split('T')[0],
      },
      medical_necessity: medicalNecessity,
      supporting_evidence: supportingEvidence,
      policy_compliance: policyCompliance,
      clinical_evidence: context.clinical_data,
    };
  }

  private async writeMedicalNecessity(context: DocumentationContext): Promise<string> {
    const prompt = `Generate a professional medical necessity narrative for a prior authorization request.

Patient Summary:
${context.clinical_data.clinical_summary}

Requested Procedure: CPT ${context.procedure_code}
Diagnosis Codes: ${context.diagnosis_codes.join(', ')}
Payer: ${context.payer}

Coverage Criteria to Address:
${context.policy_analysis.coverage_criteria.map(c => `- ${c}`).join('\n')}

Documentation Requirements:
${context.policy_analysis.documentation_requirements.map(d => `- ${d}`).join('\n')}

Write a compelling, professional medical necessity statement that:
1. References specific clinical findings from the patient record
2. Explicitly addresses each coverage criterion
3. Cites supporting evidence from the chart
4. Uses professional medical tone appropriate for payer review
5. Is 3-5 paragraphs long`;

    return this.callLLM([{ role: 'user', content: prompt }], undefined, 2000);
  }

  private gatherSupportingEvidence(
    clinicalData: DocumentationContext['clinical_data']
  ): PAPacket['supporting_evidence'] {
    const evidence: PAPacket['supporting_evidence'] = [];

    if (clinicalData.conditions.length > 0) {
      evidence.push({
        type: 'active_conditions',
        finding: `${clinicalData.conditions.length} active conditions documented in patient record`,
      });
    }

    if (clinicalData.medications.length > 0) {
      evidence.push({
        type: 'current_medications',
        finding: `${clinicalData.medications.length} current medications documented`,
      });
    }

    if (clinicalData.procedures.length > 0) {
      evidence.push({
        type: 'procedure_history',
        finding: `${clinicalData.procedures.length} prior procedures on record`,
      });
    }

    evidence.push({
      type: 'clinical_evaluation',
      finding: clinicalData.clinical_summary,
    });

    return evidence;
  }

  private mapPolicyCompliance(
    policyAnalysis: DocumentationContext['policy_analysis']
  ): PAPacket['policy_compliance'] {
    return {
      criteria_met: policyAnalysis.coverage_criteria.map(
        c => `${c} ${policyAnalysis.coverage_probability >= 0.7 ? '✓' : '⚠'}`
      ),
      documentation_attached: policyAnalysis.documentation_requirements,
    };
  }
}
