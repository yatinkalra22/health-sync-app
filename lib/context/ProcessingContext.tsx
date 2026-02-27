'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface ProcessingPA {
  paId: string;
  startedAt: number;
  elapsed: number; // seconds since start
}

interface ProcessingContextType {
  processingPAs: Map<string, ProcessingPA>;
  startProcessing: (paId: string) => void;
  finishProcessing: (paId: string) => void;
  isProcessing: (paId: string) => boolean;
  processingList: ProcessingPA[];
}

const ProcessingContext = createContext<ProcessingContextType | null>(null);

export function ProcessingProvider({ children }: { children: React.ReactNode }) {
  const [processingPAs, setProcessingPAs] = useState<Map<string, ProcessingPA>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const startProcessing = useCallback((paId: string) => {
    setProcessingPAs(prev => {
      const next = new Map(prev);
      next.set(paId, { paId, startedAt: Date.now(), elapsed: 0 });
      return next;
    });

    // Start elapsed timer
    const timer = setInterval(() => {
      setProcessingPAs(prev => {
        const entry = prev.get(paId);
        if (!entry) return prev;
        const next = new Map(prev);
        next.set(paId, { ...entry, elapsed: Math.floor((Date.now() - entry.startedAt) / 1000) });
        return next;
      });
    }, 1000);

    timersRef.current.set(paId, timer);
  }, []);

  const finishProcessing = useCallback((paId: string) => {
    const timer = timersRef.current.get(paId);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(paId);
    }
    setProcessingPAs(prev => {
      const next = new Map(prev);
      next.delete(paId);
      return next;
    });
  }, []);

  const isProcessing = useCallback((paId: string) => {
    return processingPAs.has(paId);
  }, [processingPAs]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearInterval(timer));
    };
  }, []);

  const processingList = Array.from(processingPAs.values());

  return (
    <ProcessingContext.Provider value={{ processingPAs, startProcessing, finishProcessing, isProcessing, processingList }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const ctx = useContext(ProcessingContext);
  if (!ctx) throw new Error('useProcessing must be used within ProcessingProvider');
  return ctx;
}

