export interface AgentConfig {
  name: string;
  description: string;
  maxTokens?: number;
  model?: string;
}

export interface AgentExecutionResult {
  agent: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  duration_ms: number;
}

export interface AgentStep {
  step: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  result?: string;
  error?: string;
}

export interface WorkflowState {
  pa_id: string;
  steps: AgentStep[];
  currentStep: number;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}
