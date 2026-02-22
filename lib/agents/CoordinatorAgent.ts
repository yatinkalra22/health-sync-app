import { BaseAgent } from './BaseAgent';
import { ClinicalDataGatherer } from './ClinicalDataGatherer';
import { PolicyAnalyzer } from './PolicyAnalyzer';
import { DocumentationAssembler } from './DocumentationAssembler';
import { ComplianceValidator } from './ComplianceValidator';
import { Client } from '@elastic/elasticsearch';

interface PAContext {
  pa_id: string;
  patient_id: string;
  procedure_code: string;
  diagnosis_codes: string[];
  urgency: string;
  payer: string;
}

interface PAResult {
  pa_id: string;
  status: string;
  clinical_data?: unknown;
  policy_analysis?: unknown;
  pa_packet?: unknown;
  compliance_checks?: unknown;
  execution_log: Array<{
    step: string;
    status: string;
    agent?: string;
    result_summary?: string;
    error?: string;
    timestamp?: string;
  }>;
}

export class CoordinatorAgent extends BaseAgent {
  private es: Client | null;
  private clinicalGatherer: ClinicalDataGatherer;
  private policyAnalyzer: PolicyAnalyzer;
  private documentationAssembler: DocumentationAssembler;
  private complianceValidator: ComplianceValidator;

  constructor(esClient: Client | null) {
    super(
      'Coordinator',
      'You are the PA workflow coordinator who orchestrates specialized agents to process prior authorization requests efficiently.'
    );
    this.es = esClient;
    this.clinicalGatherer = new ClinicalDataGatherer(esClient);
    this.policyAnalyzer = new PolicyAnalyzer(esClient);
    this.documentationAssembler = new DocumentationAssembler();
    this.complianceValidator = new ComplianceValidator();
  }

  async execute(context: PAContext): Promise<PAResult> {
    const { pa_id } = context;
    const executionLog: PAResult['execution_log'] = [];

    this.log('Starting PA workflow for:', pa_id);

    try {
      // Step 1: Gather clinical data
      executionLog.push({
        step: 'clinical_data_gathering',
        status: 'started',
        agent: 'ClinicalDataGatherer',
        timestamp: new Date().toISOString(),
      });

      const clinicalData = await this.clinicalGatherer.execute({
        patient_id: context.patient_id,
        procedure_code: context.procedure_code,
      });

      executionLog.push({
        step: 'clinical_data_gathering',
        status: 'completed',
        result_summary: `Found ${clinicalData.conditions.length} conditions, ${clinicalData.medications.length} medications`,
        timestamp: new Date().toISOString(),
      });

      // Step 2: Analyze policies
      executionLog.push({
        step: 'policy_analysis',
        status: 'started',
        agent: 'PolicyAnalyzer',
        timestamp: new Date().toISOString(),
      });

      const policyAnalysis = await this.policyAnalyzer.execute({
        procedure_code: context.procedure_code,
        diagnosis_codes: context.diagnosis_codes,
        payer: context.payer,
        clinical_data: clinicalData,
      });

      executionLog.push({
        step: 'policy_analysis',
        status: 'completed',
        result_summary: `Coverage probability: ${policyAnalysis.coverage_probability}`,
        timestamp: new Date().toISOString(),
      });

      // Step 3: Assemble documentation (PA packet)
      executionLog.push({
        step: 'documentation_assembly',
        status: 'started',
        agent: 'DocumentationAssembler',
        timestamp: new Date().toISOString(),
      });

      const paPacket = await this.documentationAssembler.execute({
        patient_id: context.patient_id,
        procedure_code: context.procedure_code,
        diagnosis_codes: context.diagnosis_codes,
        payer: context.payer,
        urgency: context.urgency,
        clinical_data: clinicalData,
        policy_analysis: policyAnalysis,
      });

      executionLog.push({
        step: 'documentation_assembly',
        status: 'completed',
        result_summary: 'PA packet generated with medical necessity narrative',
        timestamp: new Date().toISOString(),
      });

      // Step 4: Compliance validation
      executionLog.push({
        step: 'compliance_validation',
        status: 'started',
        agent: 'ComplianceValidator',
        timestamp: new Date().toISOString(),
      });

      const complianceChecks = await this.complianceValidator.execute({
        pa_id,
        urgency: context.urgency,
        created_at: new Date().toISOString(),
        clinical_data: clinicalData,
        policy_analysis: policyAnalysis,
        pa_packet: paPacket,
      });

      executionLog.push({
        step: 'compliance_validation',
        status: 'completed',
        result_summary: `${complianceChecks.checks_passed.length} passed, ${complianceChecks.checks_failed.length} failed, confidence: ${Math.round(complianceChecks.confidence_score * 100)}%`,
        timestamp: new Date().toISOString(),
      });

      // Determine final status
      const status = complianceChecks.hitl_required ? 'hitl_required' : 'ready_for_review';

      return {
        pa_id,
        status,
        clinical_data: clinicalData,
        policy_analysis: policyAnalysis,
        pa_packet: paPacket,
        compliance_checks: complianceChecks,
        execution_log: executionLog,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('PA workflow failed:', errorMessage);

      executionLog.push({
        step: 'error',
        status: 'failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return {
        pa_id,
        status: 'failed',
        execution_log: executionLog,
      };
    }
  }
}
