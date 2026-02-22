'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PARequest } from '@/lib/types/pa';

export function useRealTimeUpdates(paId: string) {
  const [data, setData] = useState<PARequest | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const eventSource = new EventSource(`/api/pa-updates/${paId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setData(update);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      // Reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    return eventSource;
  }, [paId]);

  useEffect(() => {
    const eventSource = connect();
    return () => eventSource.close();
  }, [connect]);

  return { data, isConnected };
}
