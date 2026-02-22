'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import MetricsSummary from './MetricsSummary';
import PARequestCard from './PARequestCard';
import type { PARequest, PAStatus } from '@/lib/types/pa';
import { SWR_REFRESH_INTERVAL_MS } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusFilters: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Processing', value: 'processing' },
  { label: 'Ready', value: 'ready_for_review' },
  { label: 'Needs Review', value: 'hitl_required' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
];

interface Props {
  initialData: PARequest[];
}

export default function PADashboard({ initialData }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: paRequests = initialData } = useSWR<PARequest[]>(
    `/api/pa-requests${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher,
    { fallbackData: initialData, refreshInterval: SWR_REFRESH_INTERVAL_MS }
  );

  const filteredRequests = paRequests.filter(pa => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pa.pa_id.toLowerCase().includes(query) ||
      pa.patient_id.toLowerCase().includes(query) ||
      pa.procedure_code.includes(query) ||
      pa.payer.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Prior Authorization Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and manage AI-powered prior authorization workflows
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New PA Request
        </Link>
      </motion.div>

      {/* Metrics */}
      <div className="mb-8">
        <MetricsSummary paRequests={paRequests} />
      </div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search PA ID, patient, procedure..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === filter.value
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* PA Request List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No PA requests found</h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first PA request to get started'}
              </p>
              {!searchQuery && (
                <Link
                  href="/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Create PA Request
                </Link>
              )}
            </motion.div>
          ) : (
            filteredRequests.map((pa, index) => (
              <PARequestCard key={pa.pa_id} pa={pa} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
