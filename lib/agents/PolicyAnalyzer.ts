import { BaseAgent } from './BaseAgent';
import { Client } from '@elastic/elasticsearch';
import type { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { ES_INDICES } from '@/lib/constants';

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

    const policies = await this.searchPolicies(procedure_code, payer, diagnosis_codes);

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
    const coverageProbability = this.calculateCoverageProbability(criteriaAnalysis);

    return {
      matched_policies: policies,
      coverage_criteria: criteriaAnalysis.criteria,
      documentation_requirements: criteriaAnalysis.documentation,
      coverage_probability: coverageProbability,
      policy_analysis: criteriaAnalysis.analysis,
    };
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

  private calculateCoverageProbability(analysis: {
    criteria: string[];
    documentation: string[];
    analysis: string;
  }): number {
    const criteriaCount = analysis.criteria.length;
    if (criteriaCount === 0) return 0.5;
    if (criteriaCount <= 3) return 0.8;
    return 0.6;
  }
}
