'use client';

import { motion } from 'framer-motion';
import { FileText, CheckCircle2, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import type { PAPacket } from '@/lib/types/pa';

export default function PAPacketPanel({ paPacket }: { paPacket?: PAPacket }) {
  if (!paPacket) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          PA Packet
        </h3>
        <p className="text-sm text-slate-400 italic">
          PA packet will be generated after agent processing completes.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 space-y-5"
    >
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        Generated PA Packet
      </h3>

      {/* Header info */}
      {paPacket.header && (
        <div className="flex flex-wrap gap-3 text-xs">
          {paPacket.header.payer && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              <Building2 className="w-3 h-3" />
              {paPacket.header.payer}
            </span>
          )}
          {paPacket.header.procedure_code && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono">
              CPT {paPacket.header.procedure_code}
            </span>
          )}
          {paPacket.header.date_of_service && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              <Calendar className="w-3 h-3" />
              {paPacket.header.date_of_service}
            </span>
          )}
        </div>
      )}

      {/* Medical Necessity Narrative */}
      {paPacket.medical_necessity && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Medical Necessity
          </h4>
          <div className="bg-white rounded-lg border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {paPacket.medical_necessity}
          </div>
        </div>
      )}

      {/* Supporting Evidence */}
      {paPacket.supporting_evidence && paPacket.supporting_evidence.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Supporting Evidence
          </h4>
          <div className="space-y-2">
            {paPacket.supporting_evidence.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm bg-white rounded-lg border border-slate-100 p-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <p className="text-slate-600 mt-0.5">{item.finding}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Compliance */}
      {paPacket.policy_compliance && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Policy Compliance
          </h4>
          {paPacket.policy_compliance.criteria_met && paPacket.policy_compliance.criteria_met.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {paPacket.policy_compliance.criteria_met.map((criterion, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {criterion.includes('✓') ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-slate-600">{criterion}</span>
                </div>
              ))}
            </div>
          )}
          {paPacket.policy_compliance.documentation_attached && paPacket.policy_compliance.documentation_attached.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Required Documentation
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paPacket.policy_compliance.documentation_attached.map((doc, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
