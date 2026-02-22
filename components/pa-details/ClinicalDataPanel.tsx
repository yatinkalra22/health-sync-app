'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Activity, Stethoscope, HeartPulse, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ClinicalData } from '@/lib/types/pa';

type TabKey = 'conditions' | 'medications' | 'procedures' | 'observations';

const tabs: { key: TabKey; label: string; icon: typeof Pill }[] = [
  { key: 'conditions', label: 'Conditions', icon: HeartPulse },
  { key: 'medications', label: 'Medications', icon: Pill },
  { key: 'procedures', label: 'Procedures', icon: Stethoscope },
  { key: 'observations', label: 'Observations', icon: Activity },
];

export default function ClinicalDataPanel({ clinicalData }: { clinicalData?: ClinicalData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('conditions');
  const [expanded, setExpanded] = useState(true);

  if (!clinicalData) return null;

  const getDisplayName = (item: Record<string, unknown>): string => {
    const code = item.code as Record<string, unknown> | undefined;
    const medCode = item.medicationCodeableConcept as Record<string, unknown> | undefined;
    return (code?.text as string) || (medCode?.text as string) || 'Unknown';
  };

  const getItems = (): unknown[] => {
    switch (activeTab) {
      case 'conditions': return clinicalData.conditions || [];
      case 'medications': return clinicalData.medications || [];
      case 'procedures': return clinicalData.procedures || [];
      case 'observations': return clinicalData.observations || [];
    }
  };

  const items = getItems();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 pb-4 hover:bg-slate-50/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-500" />
          Clinical Data
        </h3>
        <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {clinicalData.clinical_summary && (
              <div className="px-6 pb-4">
                <div className="bg-blue-50/70 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    AI Clinical Summary
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {clinicalData.clinical_summary}
                  </p>
                </div>
              </div>
            )}

            <div className="px-4 sm:px-6 flex gap-1 overflow-x-auto border-b border-slate-100">
              {tabs.map((tab) => {
                const count = (clinicalData[tab.key] as unknown[] | undefined)?.length || 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors',
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 border border-slate-200 border-b-white -mb-px'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 pt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No {activeTab} recorded</p>
                  ) : (
                    items.map((item: unknown, i: number) => {
                      const record = item as Record<string, unknown>;
                      const valueQuantity = record.valueQuantity as { value: number; unit: string } | undefined;
                      return (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-sm text-slate-700">{getDisplayName(record)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {valueQuantity && (
                              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                                {valueQuantity.value} {valueQuantity.unit}
                              </span>
                            )}
                            {((record.clinicalStatus as string) || (record.status as string)) && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                                {(record.clinicalStatus as string) || (record.status as string)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
