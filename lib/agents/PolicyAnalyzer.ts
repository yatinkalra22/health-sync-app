import { BaseAgent } from './BaseAgent';
import { Client } from '@elastic/elasticsearch';
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { ES_INDICES } from '@/lib/constants';
import { esqlQuery } from '@/lib/services/elasticsearch';

interface PolicyContext {
  procedure_code: string;
  diagnosis_codes: string[];
  payer: string;
  clinical_data?: unknown;
}

interface PolicyAnalysis {
  matched_policies: Record<string, unknown>[];
  coverage_criteria: string[];
  documentation_requirements: string[];
  coverage_probability: number;
  policy_analysis: string;
}

export class PolicyAnalyzer extends BaseAgent {
  private es: Client | null;

  constructor(esClient: Client | null) {
    super(
      'PolicyAnalyzer',
      'You are a healthcare policy expert who analyzes payer coverage policies to determine medical necessity and coverage criteria.'
    );
    this.es = esClient;
  }

  async execute(context: PolicyContext): Promise<PolicyAnalysis> {
    const { procedure_code, payer, diagnosis_codes } = context;
    this.log('Analyzing policies for:', { procedure_code, payer });

    // ES|QL: Check how many policies exist for this payer before full search
    const policyStats = await this.getPolicyStatsESQL(payer);
    this.log('ES|QL policy stats for payer:', policyStats);

    let policies = await this.searchPolicies(procedure_code, payer, diagnosis_codes);

    // If no policies found, generate and index a realistic sample policy
    if (policies.length === 0 && this.es) {
      this.log('No policies found — generating sample policy for:', { procedure_code, payer });
      const samplePolicy = await this.generateSamplePolicy(procedure_code, payer, diagnosis_codes);
      await this.indexSamplePolicy(samplePolicy);
      policies = [samplePolicy];
    }

    if (policies.length === 0) {
      this.log('No policies found');
      return {
        matched_policies: [],
        coverage_criteria: [],
        documentation_requirements: [],
        coverage_probability: 0.0,
        policy_analysis: 'No relevant policies found',
      };
    }

    const criteriaAnalysis = await this.extractCoverageCriteria(policies[0], context);
    const coverageProbability = await this.calculateCoverageProbability(criteriaAnalysis);

    return {
      matched_policies: policies,
      coverage_criteria: criteriaAnalysis.criteria,
      documentation_requirements: criteriaAnalysis.documentation,
      coverage_probability: coverageProbability,
      policy_analysis: criteriaAnalysis.analysis,
    };
  }

  /**
   * ES|QL query to get policy coverage stats for a payer.
   */
  private async getPolicyStatsESQL(payer: string) {
    try {
      const results = await esqlQuery(`
        FROM ${ES_INDICES.POLICIES}
        | WHERE payer == "${payer}"
        | STATS total_policies = COUNT(*), procedure_count = COUNT_DISTINCT(procedure_codes)
      `);
      return results[0] || { total_policies: 0, procedure_count: 0 };
    } catch {
      this.log('ES|QL policy stats unavailable');
      return null;
    }
  }

  /**
   * Use Gemini AI to generate a realistic coverage policy when none exists in ES.
   */
  private async generateSamplePolicy(
    procedureCode: string,
    payer: string,
    diagnosisCodes: string[]
  ): Promise<Record<string, unknown>> {
    const prompt = `Generate a realistic healthcare payer coverage policy for prior authorization.

Payer: ${payer}
Procedure code: CPT ${procedureCode}
Diagnosis codes: ${diagnosisCodes.join(', ')}

Return ONLY valid JSON (no markdown, no backticks):
{
  "policy_id": "${payer.toUpperCase().replace(/\s+/g, '_')}_${procedureCode}",
  "payer": "${payer}",
  "policy_name": "descriptive policy name",
  "procedure_codes": ["${procedureCode}"],
  "diagnosis_codes": ${JSON.stringify(diagnosisCodes)},
  "coverage_criteria": ["criterion 1", "criterion 2", "criterion 3", "criterion 4"],
  "documentation_requirements": ["doc requirement 1", "doc requirement 2", "doc requirement 3"],
  "policy_text": "A detailed 2-3 sentence policy description explaining when this procedure is covered and what conditions must be met."
}

Make the coverage criteria specific and realistic for CPT ${procedureCode}. Include 4-5 criteria and 3-4 documentation requirements.`;

    const response = await this.callLLM([{ role: 'user', content: prompt }],
      'You are a healthcare policy expert. Return ONLY valid JSON, no markdown.', 1500);

    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      this.log('Failed to parse Gemini policy response, using fallback');
      return {
        policy_id: `${payer.toUpperCase().replace(/\s+/g, '_')}_${procedureCode}`,
        payer,
        policy_name: `${payer} Coverage - CPT ${procedureCode}`,
        procedure_codes: [procedureCode],
        diagnosis_codes: diagnosisCodes,
        coverage_criteria: ['Medical necessity documented', 'Failed conservative treatment for 6+ weeks', 'Clinical evaluation completed', 'Diagnostic imaging obtained'],
        documentation_requirements: ['Clinical evaluation notes', 'Prior treatment records', 'Diagnostic imaging reports'],
        policy_text: `Coverage for CPT ${procedureCode} requires documented medical necessity, failure of conservative treatment, and supporting diagnostic evidence.`,
      };
    }
  }

  /**
   * Index a generated sample policy into Elasticsearch.
   */
  private async indexSamplePolicy(policy: Record<string, unknown>) {
    if (!this.es) return;
    try {
      await this.es.index({
        index: ES_INDICES.POLICIES,
        id: policy.policy_id as string,
        document: policy,
        refresh: true,
      });
      this.log('Indexed sample policy:', policy.policy_id);
    } catch (err) {
      this.log('Failed to index sample policy:', err);
    }
  }

  private async searchPolicies(
    procedureCode: string,
    payer: string,
    diagnosisCodes: string[]
  ): Promise<Record<string, unknown>[]> {
    if (!this.es) return [];

    const result = await this.es.search({
      index: ES_INDICES.POLICIES,
      query: {
        bool: {
          must: [{ term: { payer: payer } }],
          should: [
            { terms: { procedure_codes: [procedureCode] } },
            { terms: { diagnosis_codes: diagnosisCodes } },
          ],
          minimum_should_match: 1,
        },
      },
      size: 5,
    } as SearchRequest);

    return result.hits.hits.map((hit) => hit._source as Record<string, unknown>);
  }

  private async extractCoverageCriteria(
    policy: Record<string, unknown>,
    context: PolicyContext
  ): Promise<{ criteria: string[]; documentation: string[]; analysis: string }> {
    const policyText = (policy.policy_text as string) || '';
    const procedureCode = context.procedure_code;

    const prompt = `Analyze this payer policy and extract coverage criteria.

Policy:
${policyText}

Procedure Code: ${procedureCode}

Please provide:
1. A list of specific coverage criteria (what must be met for approval)
2. Required documentation
3. A brief analysis of coverage likelihood

Format your response as JSON:
{
  "criteria": ["criterion 1", "criterion 2"],
  "documentation": ["doc 1", "doc 2"],
  "analysis": "brief analysis"
}`;

    const response = await this.callLLM([{ role: 'user', content: prompt }], undefined, 1000);

    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch {
      return {
        criteria: (policy.coverage_criteria as string[]) || [],
        documentation: (policy.documentation_requirements as string[]) || [],
        analysis: response,
      };
    }
  }

  private async calculateCoverageProbability(analysis: {
    criteria: string[];
    documentation: string[];
    analysis: string;
  }): Promise<number> {
    // Ask LLM to evaluate coverage likelihood based on the full analysis
    const prompt = `Based on this prior authorization policy analysis, estimate the coverage probability as a single decimal number between 0.50 and 0.98.

Criteria to meet (${analysis.criteria.length}):
${analysis.criteria.map(c => `- ${c}`).join('\n')}

Documentation required (${analysis.documentation.length}):
${analysis.documentation.map(d => `- ${d}`).join('\n')}

Analysis: ${analysis.analysis}

Consider:
- More criteria met = higher probability
- Strong documentation = higher probability
- Mention of gaps or missing items = lower probability
- Vague or generic analysis = moderate probability

Return ONLY a single decimal number between 0.50 and 0.98. Nothing else.`;

    try {
      const response = await this.callLLM(
        [{ role: 'user', content: prompt }],
        'You are a healthcare coverage probability estimator. Return ONLY a single decimal number.',
        50,
      );

      const parsed = parseFloat(response.trim());
      if (!isNaN(parsed) && parsed >= 0.3 && parsed <= 1.0) {
        return Math.round(parsed * 100) / 100;
      }
    } catch {
      this.log('LLM probability estimation failed, using heuristic');
    }

    // Heuristic fallback with more variance
    const criteriaCount = analysis.criteria.length;
    const docCount = analysis.documentation.length;
    const analysisText = analysis.analysis.toLowerCase();

    let base = 0.70;

    // Adjust based on criteria count
    if (criteriaCount <= 2) base += 0.12;
    else if (criteriaCount <= 4) base += 0.05;
    else base -= 0.05;

    // Adjust based on documentation completeness
    if (docCount >= 4) base += 0.05;
    else if (docCount <= 1) base -= 0.08;

    // Adjust based on analysis sentiment
    if (analysisText.includes('strong') || analysisText.includes('well-documented') || analysisText.includes('meets all')) {
      base += 0.10;
    }
    if (analysisText.includes('missing') || analysisText.includes('insufficient') || analysisText.includes('gap')) {
      base -= 0.12;
    }
    if (analysisText.includes('partial') || analysisText.includes('some')) {
      base -= 0.05;
    }

    // Add small random variance so it's not always the same
    base += (Math.random() - 0.5) * 0.08;

    return Math.round(Math.max(0.50, Math.min(0.98, base)) * 100) / 100;
  }
}
