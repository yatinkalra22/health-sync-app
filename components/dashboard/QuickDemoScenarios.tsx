'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { createPARequest } from '@/actions/pa-actions';

// --- Randomization pools ---

const CLINICIANS = [
  'Dr. Sarah Chen', 'Dr. Michael Torres', 'Dr. Lisa Park', 'Dr. James Rodriguez',
  'Dr. Emily Nguyen', 'Dr. David Patel', 'Dr. Maria Garcia', 'Dr. Robert Kim',
  'Dr. Amanda Foster', 'Dr. William Chang', 'Dr. Rachel Adams', 'Dr. Carlos Mendez',
];

const PAYERS = [
  'Blue Cross Blue Shield', 'Aetna', 'Medicare', 'UnitedHealthcare',
  'Cigna', 'Humana', 'Kaiser Permanente',
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Each scenario type has multiple variants for diagnosis codes and notes
const EXPEDITED_VARIANTS = [
  { diagnosis_codes: 'M17.11,M25.561', notes: 'Patient experiencing severe pain, limited mobility. Conservative treatment exhausted over 6 months.' },
  { diagnosis_codes: 'M17.12,M25.562', notes: 'Bilateral knee osteoarthritis with bone-on-bone contact. Failed PT and cortisone injections.' },
  { diagnosis_codes: 'M17.11,M79.3', notes: 'Progressive joint deterioration. Patient unable to perform daily activities. Wheelchair-dependent.' },
  { diagnosis_codes: 'M17.0,M25.561', notes: 'Severe cartilage loss confirmed by MRI. 8 months of conservative treatment with no improvement.' },
  { diagnosis_codes: 'M17.11,G89.29', notes: 'Chronic knee pain refractory to all conservative measures. Surgical intervention urgently needed.' },
];

const HITL_VARIANTS = [
  { diagnosis_codes: 'M23.211', notes: 'Arthroscopic meniscectomy. Prior imaging not yet available.' },
  { diagnosis_codes: 'M23.221,M23.30', notes: 'Suspected meniscal tear with locking episodes. Awaiting MRI confirmation.' },
  { diagnosis_codes: 'M23.211,M25.362', notes: 'Recurrent knee instability after meniscal injury. Incomplete documentation from referring physician.' },
  { diagnosis_codes: 'M23.201', notes: 'Knee arthroscopy evaluation needed. Physical therapy notes pending from external provider.' },
  { diagnosis_codes: 'M23.211,M79.669', notes: 'Persistent mechanical symptoms in right knee. Conservative treatment records from prior clinic not yet received.' },
];

const QUICK_VARIANTS = [
  { diagnosis_codes: 'K21.0,K44.9', notes: 'Upper GI endoscopy with biopsy. All pre-op labs and imaging available.' },
  { diagnosis_codes: 'K21.0,K22.70', notes: 'GERD refractory to 12 weeks of PPI therapy. Complete symptom documentation attached.' },
  { diagnosis_codes: 'K21.0,R13.10', notes: 'Progressive dysphagia with documented weight loss. Barium swallow completed.' },
  { diagnosis_codes: 'K44.9,K21.0', notes: 'Symptomatic hiatal hernia with GERD. Failed maximal medical therapy. All records available.' },
  { diagnosis_codes: 'K21.0,K22.10', notes: 'Suspected Barrett esophagus screening. Complete medication history and prior imaging on file.' },
];

interface ScenarioConfig {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  color: string;
  bgColor: string;
  procedure_code: string;
  urgency: string;
  variants: Array<{ diagnosis_codes: string; notes: string }>;
}

const scenarios: ScenarioConfig[] = [
  {
    id: 'expedited',
    title: 'Expedited Knee Surgery',
    description: 'Urgent total knee replacement requiring fast-track approval',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30',
    procedure_code: '27447',
    urgency: 'expedited',
    variants: EXPEDITED_VARIANTS,
  },
  {
    id: 'hitl',
    title: 'Missing Documentation',
    description: 'Case requiring human-in-the-loop review for completeness',
    icon: AlertTriangle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/5 border-rose-500/15 hover:border-rose-500/30',
    procedure_code: '29881',
    urgency: 'standard',
    variants: HITL_VARIANTS,
  },
  {
    id: 'quick',
    title: 'Quick Approval',
    description: 'Straightforward case with complete documentation for fast approval',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30',
    procedure_code: '43239',
    urgency: 'standard',
    variants: QUICK_VARIANTS,
  },
];

/** Build a randomized form data object for a scenario */
function buildRandomFormData(scenario: ScenarioConfig): Record<string, string> {
  const variant = pick(scenario.variants);
  const patientNum = Math.floor(Math.random() * 90000) + 10000;

  return {
    patient_id: `patient-${patientNum}`,
    procedure_code: scenario.procedure_code,
    diagnosis_codes: variant.diagnosis_codes,
    urgency: scenario.urgency,
    payer: pick(PAYERS),
    clinician_id: pick(CLINICIANS),
    notes: variant.notes,
  };
}

export default function QuickDemoScenarios() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleScenario = async (scenario: ScenarioConfig) => {
    setLoadingId(scenario.id);
    try {
      const formData = buildRandomFormData(scenario);
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
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
