export type ActionType = 
  | 'read_file' 
  | 'write_file' 
  | 'exec_command' 
  | 'network_send' 
  | 'spawn_agent' 
  | 'modify_policy';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HarmInvariant {
  id: string;
  category: string;
  rule: string;
  immutable: boolean;
  appliesTo: string[];
}

export interface ConcordPolicy {
  id: string;
  agentName: string;
  adminSignature: string;
  signatureValid: boolean;
  updatedAt: string;
  resourceLimits: {
    maxTimeSeconds: number;
    maxMemoryMB: number;
    maxCpuPercent: number;
    maxRecursionDepth: number;
    maxSubAgents: number;
  };
  allowedSyscalls: string[];
  allowedPaths: string[];
  forbiddenActions: {
    network: 'none' | 'whitelisted' | 'any';
    fileWriteForbiddenPrefixes: string[];
    forbiddenBinaries: string[];
    disallowForkBomb: boolean;
  };
  harmInvariants: HarmInvariant[];
}

export interface AgentProposal {
  id: string;
  timestamp: number;
  agentId: string;
  actionType: ActionType;
  target: string;
  payload?: string;
  metadata?: Record<string, any>;
  riskLevel: RiskLevel;
  requiresHumanConsent: boolean;
  simulatedAttacker?: boolean;
}

export interface PipelineStageResult {
  stage: 'controller' | 'firewall' | 'verification' | 'consent' | 'broker';
  passed: boolean;
  code: string;
  message: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface ProposalExecutionResult {
  proposal: AgentProposal;
  status: 'allowed' | 'denied' | 'blocked' | 'halted' | 'pending_consent';
  rejectionStage?: 'controller' | 'firewall' | 'verification' | 'consent' | 'broker';
  stages: PipelineStageResult[];
  outputMessage: string;
  executedAt: number;
  simulatedOutput?: string;
  reversible: boolean;
}

export interface LedgerBlock {
  blockNumber: number;
  timestamp: number;
  proposalId: string;
  agentId: string;
  actionType: ActionType;
  target: string;
  verdict: 'ALLOWED' | 'DENIED' | 'HALTED' | 'EMERGENCY_STOP' | 'ROLLBACK';
  rejectionReason?: string;
  tpmMonotonicCounter: number;
  previousHash: string;
  blockHash: string;
  signature: string;
  tampered?: boolean;
}

export interface AdversarialTest {
  id: string;
  name: string;
  category: 'Prompt Injection' | 'Privilege Escalation' | 'Policy Tampering' | 'Recursive Spawn' | 'Resource Exhaustion' | 'Sandbox Escape' | 'Data Exfiltration' | 'Unsigned Code' | 'Post-Cancellation' | 'Ledger Tampering';
  description: string;
  threatMatrixRef: string; // e.g. MITRE ATLAS T1028, OWASP LLM01
  proposal: AgentProposal;
  expectedInvariant: string;
  simulatedTamperBlockIndex?: number;
}

export interface AdversarialTestResult {
  testId: string;
  passed: boolean;
  durationMs: number;
  logSummary: string;
  invariantMet: boolean;
  timestamp: number;
}

export interface SystemMetrics {
  activeAgentsCount: number;
  taskRecursionDepth: number;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
  emergencyStopEngaged: boolean;
  lastSnapshotTimestamp: number;
}
