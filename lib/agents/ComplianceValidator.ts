import { BaseAgent } from './BaseAgent';

interface ComplianceContext {
  pa_id: string;
  urgency: string;
  created_at: string;
  clinical_data?: {
    patient_demographics: Record<string, unknown>;
    conditions: unknown[];
    medications: unknown[];
    clinical_summary: string;
    complexity_score: number;
  };
  policy_analysis?: {
    matched_policies: unknown[];
    coverage_criteria: string[];
    documentation_requirements: string[];
    coverage_probability: number;
  };
  pa_packet?: {
    medical_necessity: string;
    supporting_evidence: unknown[];
    header: Record<string, unknown>;
  };
}

interface ComplianceResult {
  is_valid: boolean;
  checks_passed: string[];
  checks_failed: string[];
  hitl_required: boolean;
  confidence_score: number;
  timeline_compliant: boolean;
  deadline: string;
}

export class ComplianceValidator extends BaseAgent {
  constructor() {
    super(
      'ComplianceValidator',
      'You are a healthcare compliance expert who validates prior authorization packets against CMS regulations, documentation completeness, and clinical appropriateness requirements.'
    );
  }

  async execute(context: ComplianceContext): Promise<ComplianceResult> {
    this.log('Running compliance validation for:', context.pa_id);

    const passed: string[] = [];
    const failed: string[] = [];

    // 1. CMS timeline compliance
    const timelineCheck = this.checkCMSTimeline(context.urgency, context.created_at);
    if (timelineCheck.compliant) {
      passed.push(`CMS timeline: ${timelineCheck.message}`);
    } else {
      failed.push(`CMS timeline: ${timelineCheck.message}`);
    }

    // 2. Required fields check
    const fieldsCheck = this.checkRequiredFields(context);
    passed.push(...fieldsCheck.passed);
    failed.push(...fieldsCheck.failed);

    // 3. Clinical data completeness
    const clinicalCheck = this.checkClinicalCompleteness(context.clinical_data);
    passed.push(...clinicalCheck.passed);
    failed.push(...clinicalCheck.failed);

    // 4. Policy match validation
    const policyCheck = this.checkPolicyMatch(context.policy_analysis);
    passed.push(...policyCheck.passed);
    failed.push(...policyCheck.failed);

    // 5. Documentation completeness
    const docCheck = this.checkDocumentationCompleteness(context.pa_packet);
    passed.push(...docCheck.passed);
    failed.push(...docCheck.failed);

    // Calculate confidence
    const totalChecks = passed.length + failed.length;
    const baseScore = totalChecks > 0 ? passed.length / totalChecks : 0;
    const policyScore = context.policy_analysis?.coverage_probability ?? 0;
    const confidence = Math.round(((baseScore * 0.4) + (policyScore * 0.6)) * 100) / 100;

    // Determine if HITL is required
    const hitlRequired =
      confidence < 0.7 ||
      context.urgency === 'expedited' ||
      (context.clinical_data?.complexity_score ?? 0) > 0.7 ||
      failed.length > 0;

    return {
      is_valid: failed.length === 0,
      checks_passed: passed,
      checks_failed: failed,
      hitl_required: hitlRequired,
      confidence_score: confidence,
      timeline_compliant: timelineCheck.compliant,
      deadline: timelineCheck.deadline,
    };
  }

  private checkCMSTimeline(urgency: string, createdAt: string) {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    const maxHours = urgency === 'expedited' ? 72 : 168; // 72h or 7 days
    const deadline = new Date(created.getTime() + maxHours * 60 * 60 * 1000);

    return {
      compliant: hoursElapsed < maxHours,
      message: urgency === 'expedited'
        ? `Expedited: ${Math.round(72 - hoursElapsed)}h remaining of 72h deadline`
        : `Standard: ${Math.round(168 - hoursElapsed)}h remaining of 7-day deadline`,
      deadline: deadline.toISOString(),
    };
  }

  private checkRequiredFields(context: ComplianceContext) {
    const passed: string[] = [];
    const failed: string[] = [];

    if (context.pa_id) passed.push('PA ID present');
    else failed.push('Missing PA ID');

    if (context.clinical_data) passed.push('Clinical data gathered');
    else failed.push('Missing clinical data');

    if (context.policy_analysis) passed.push('Policy analysis completed');
    else failed.push('Missing policy analysis');

    if (context.pa_packet) passed.push('PA packet generated');
    else failed.push('Missing PA packet');

    return { passed, failed };
  }

  private checkClinicalCompleteness(clinicalData?: ComplianceContext['clinical_data']) {
    const passed: string[] = [];
    const failed: string[] = [];

    if (!clinicalData) {
      failed.push('No clinical data available');
      return { passed, failed };
    }

    if (clinicalData.patient_demographics && Object.keys(clinicalData.patient_demographics).length > 1) {
      passed.push('Patient demographics available');
    } else {
      failed.push('Incomplete patient demographics');
    }

    if (clinicalData.conditions.length > 0) {
      passed.push(`${clinicalData.conditions.length} conditions documented`);
    } else {
      failed.push('No conditions documented');
    }

    if (clinicalData.clinical_summary && clinicalData.clinical_summary.length > 20) {
      passed.push('Clinical summary generated');
    } else {
      failed.push('Clinical summary missing or insufficient');
    }

    return { passed, failed };
  }

  private checkPolicyMatch(policyAnalysis?: ComplianceContext['policy_analysis']) {
    const passed: string[] = [];
    const failed: string[] = [];

    if (!policyAnalysis) {
      failed.push('No policy analysis available');
      return { passed, failed };
    }

    if (policyAnalysis.matched_policies.length > 0) {
      passed.push(`${policyAnalysis.matched_policies.length} matching policies found`);
    } else {
      failed.push('No matching policies found');
    }

    if (policyAnalysis.coverage_probability >= 0.7) {
      passed.push(`Coverage probability: ${Math.round(policyAnalysis.coverage_probability * 100)}%`);
    } else {
      failed.push(`Low coverage probability: ${Math.round(policyAnalysis.coverage_probability * 100)}%`);
    }

    return { passed, failed };
  }

  private checkDocumentationCompleteness(paPacket?: ComplianceContext['pa_packet']) {
    const passed: string[] = [];
    const failed: string[] = [];

    if (!paPacket) {
      failed.push('No PA packet generated');
      return { passed, failed };
    }

    if (paPacket.medical_necessity && paPacket.medical_necessity.length > 50) {
      passed.push('Medical necessity narrative present');
    } else {
      failed.push('Medical necessity narrative missing or too brief');
    }

    if (paPacket.supporting_evidence && paPacket.supporting_evidence.length > 0) {
      passed.push(`${paPacket.supporting_evidence.length} supporting evidence items`);
    } else {
      failed.push('No supporting evidence attached');
    }

    return { passed, failed };
  }
}
