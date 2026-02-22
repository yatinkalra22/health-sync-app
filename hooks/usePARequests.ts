'use client';

import useSWR from 'swr';
import type { PARequest } from '@/lib/types/pa';
import { SWR_REFRESH_INTERVAL_MS } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function usePARequests(status?: string) {
  const url = `/api/pa-requests${status ? `?status=${status}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<PARequest[]>(url, fetcher, {
    refreshInterval: SWR_REFRESH_INTERVAL_MS,
  });

  return {
    paRequests: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function usePARequest(paId: string) {
  const { data, error, isLoading, mutate } = useSWR<PARequest>(
    `/api/pa-requests/${paId}`,
    fetcher,
    { refreshInterval: SWR_REFRESH_INTERVAL_MS }
  );

  return {
    pa: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
