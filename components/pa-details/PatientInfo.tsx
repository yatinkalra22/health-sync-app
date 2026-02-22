'use client';

import { motion } from 'framer-motion';
import { User, Calendar, MapPin, Hash } from 'lucide-react';
import type { ClinicalData } from '@/lib/types/pa';

export default function PatientInfo({ clinicalData }: { clinicalData?: ClinicalData }) {
  const demo = clinicalData?.patient_demographics;
  if (!demo) return null;

  const items = [
    { label: 'Patient ID', value: demo.patient_id, icon: Hash },
    { label: 'Name', value: demo.name?.full || 'N/A', icon: User },
    { label: 'Date of Birth', value: demo.birthDate || 'N/A', icon: Calendar },
    { label: 'Gender', value: demo.gender || 'N/A', icon: User },
    { label: 'Location', value: demo.address ? `${demo.address.city}, ${demo.address.state}` : 'N/A', icon: MapPin },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-500" />
        Patient Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              {item.label}
            </p>
            <p className="text-sm font-medium text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
