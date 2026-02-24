'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { createPARequest } from '@/actions/pa-actions';

const scenarios = [
  {
    id: 'expedited',
    title: 'Expedited Knee Surgery',
    description: 'Urgent total knee replacement requiring fast-track approval',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30',
    formData: {
      patient_id: 'patient-demo-001',
      procedure_code: '27447',
      diagnosis_codes: 'M17.11,M25.561',
      urgency: 'expedited',
      payer: 'Blue Cross Blue Shield',
      clinician_id: 'Dr. Sarah Chen',
      notes: 'Patient experiencing severe pain, limited mobility. Conservative treatment exhausted over 6 months.',
    },
  },
  {
    id: 'hitl',
    title: 'Missing Documentation',
    description: 'Case requiring human-in-the-loop review for completeness',
    icon: AlertTriangle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/5 border-rose-500/15 hover:border-rose-500/30',
    formData: {
      patient_id: 'patient-demo-002',
      procedure_code: '29881',
      diagnosis_codes: 'M23.211',
      urgency: 'standard',
      payer: 'Aetna',
      clinician_id: 'Dr. Michael Torres',
      notes: 'Arthroscopic meniscectomy. Prior imaging not yet available.',
    },
  },
  {
    id: 'quick',
    title: 'Quick Approval',
    description: 'Straightforward case with complete documentation for fast approval',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30',
    formData: {
      patient_id: 'patient-demo-003',
      procedure_code: '43239',
      diagnosis_codes: 'K21.0,K44.9',
      urgency: 'standard',
      payer: 'Medicare',
      clinician_id: 'Dr. Lisa Park',
      notes: 'Upper GI endoscopy with biopsy. All pre-op labs and imaging available.',
    },
  },
];

export default function QuickDemoScenarios() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleScenario = async (scenario: typeof scenarios[0]) => {
    setLoadingId(scenario.id);
    try {
      const fd = new FormData();
      Object.entries(scenario.formData).forEach(([key, value]) => {
        fd.append(key, value);
      });
      const paId = await createPARequest(fd);
      router.push(`/pa/${paId}`);
    } catch {
      setLoadingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-700">Quick Demo Scenarios</h2>
        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100">One-click</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenario(scenario)}
            disabled={loadingId !== null}
            className={`glass-card rounded-xl p-4 text-left border transition-all duration-200 ${scenario.bgColor} disabled:opacity-60`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${scenario.color}`}>
                {loadingId === scenario.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <scenario.icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{scenario.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{scenario.description}</p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                  {loadingId === scenario.id ? 'Creating...' : 'Try it →'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
