'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  User,
  Stethoscope,
  Building2,
  FileText,
  Zap,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PAYERS, COMMON_PROCEDURES, PA_URGENCY_OPTIONS } from '@/lib/constants';

export default function NewPAForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    procedure_code: '',
    diagnosis_codes: '',
    payer: 'Medicare',
    urgency: 'standard',
    clinician_id: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pa-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          diagnosis_codes: formData.diagnosis_codes.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to create PA:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">PA Request Submitted!</h2>
        <p className="text-slate-500 mb-2">AI agents are now processing your request.</p>
        <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-8"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">New Prior Authorization Request</h1>
          <p className="text-sm text-slate-500">
            Submit a new PA request for AI-powered processing and policy analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Clinician */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <User className="w-4 h-4 text-blue-500" />
                Patient ID *
              </label>
              <input
                type="text"
                required
                value={formData.patient_id}
                onChange={e => updateField('patient_id', e.target.value)}
                placeholder="e.g., Patient-1042"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                Clinician ID
              </label>
              <input
                type="text"
                value={formData.clinician_id}
                onChange={e => updateField('clinician_id', e.target.value)}
                placeholder="e.g., DR-4521"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Procedure */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              Procedure Code (CPT) *
            </label>
            <input
              type="text"
              required
              value={formData.procedure_code}
              onChange={e => updateField('procedure_code', e.target.value)}
              placeholder="e.g., 27447"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all mb-2"
            />
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto sm:max-h-none">
              {COMMON_PROCEDURES.map(p => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => updateField('procedure_code', p.code)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    formData.procedure_code === p.code
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  )}
                >
                  {p.code} - {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis Codes */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Diagnosis Codes (ICD-10) *
            </label>
            <input
              type="text"
              required
              value={formData.diagnosis_codes}
              onChange={e => updateField('diagnosis_codes', e.target.value)}
              placeholder="e.g., M17.11, M17.12 (comma separated)"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Payer & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Payer *
              </label>
              <select
                value={formData.payer}
                onChange={e => updateField('payer', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                {PAYERS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Urgency
              </label>
              <div className="flex gap-2">
                {PA_URGENCY_OPTIONS.map(urgency => (
                  <button
                    key={urgency}
                    type="button"
                    onClick={() => updateField('urgency', urgency)}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                      formData.urgency === urgency
                        ? urgency === 'expedited'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {urgency === 'expedited' && <Zap className="w-3 h-3 inline mr-1" />}
                    {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Clinical Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Additional clinical context or notes..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              AI agents will automatically process this request after submission
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit PA Request
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
