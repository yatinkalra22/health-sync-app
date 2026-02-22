'use client';

import { useState, useEffect } from 'react';

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: string;
}

export function useAgentStatus() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'CoordinatorAgent', status: 'idle' },
    { name: 'ClinicalDataGatherer', status: 'idle' },
    { name: 'PolicyAnalyzer', status: 'idle' },
  ]);

  useEffect(() => {
    // In production, this would connect to a real status endpoint
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        lastRun: agent.lastRun || new Date().toISOString(),
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { agents };
}
