'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import ConfidenceRing from '@/components/ui/ConfidenceRing';
import type { PolicyAnalysis, ComplianceChecks } from '@/lib/types/pa';

interface Props {
  policyAnalysis?: PolicyAnalysis;
  complianceChecks?: ComplianceChecks;
}

export default function PolicyAnalysisPanel({ policyAnalysis, complianceChecks }: Props) {
  if (!policyAnalysis && !complianceChecks) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-6 space-y-6"
    >
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-500" />
        Policy Analysis & Compliance
      </h3>

      {policyAnalysis && (
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
          <ConfidenceRing score={policyAnalysis.coverage_probability} size={64} />
          <div>
            <p className="text-sm font-semibold text-slate-800">Coverage Probability</p>
            <p className="text-xs text-slate-500 mt-0.5">{policyAnalysis.policy_analysis}</p>
          </div>
        </div>
      )}

      {policyAnalysis?.coverage_criteria && policyAnalysis.coverage_criteria.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Coverage Criteria
          </h4>
          <div className="space-y-1.5">
            {policyAnalysis.coverage_criteria.map((criterion, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                {criterion}
              </div>
            ))}
          </div>
        </div>
      )}

      {policyAnalysis?.documentation_requirements && policyAnalysis.documentation_requirements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Required Documentation
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {policyAnalysis.documentation_requirements.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {doc}
              </div>
            ))}
          </div>
        </div>
      )}

      {complianceChecks && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Compliance Status</h4>
          <div className="space-y-2">
            {complianceChecks.checks_passed.map((check, i) => (
              <div key={`pass-${i}`} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">{check}</span>
              </div>
            ))}
            {complianceChecks.checks_failed.map((check, i) => (
              <div key={`fail-${i}`} className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-600 font-medium">{check}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
