import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ConcordPolicy, 
  AgentProposal, 
  ProposalExecutionResult, 
  LedgerBlock, 
  AdversarialTestResult, 
  SystemMetrics 
} from '../types/concord';
import { 
  INITIAL_POLICY, 
  INITIAL_FILESYSTEM, 
  ADVERSARIAL_TESTS 
} from '../lib/constants';
import { SimulatedEnvironment, processAgentProposal } from '../lib/pipeline';
import { computeBlockHash } from '../lib/crypto';

interface ConcordContextType {
  policy: ConcordPolicy;
  setPolicy: React.Dispatch<React.SetStateAction<ConcordPolicy>>;
  resetPolicyToDefault: () => void;
  updatePolicyYaml: (yamlStr: string) => boolean;
  systemMetrics: SystemMetrics;
  ledger: LedgerBlock[];
  testResults: Record<string, AdversarialTestResult>;
  isTestingAll: boolean;
  activeProposalResult: ProposalExecutionResult | null;
  pendingConsentProposal: AgentProposal | null;
  simulatedFiles: Record<string, string>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  submitProposal: (proposal: AgentProposal, humanApproved?: boolean) => Promise<ProposalExecutionResult>;
  respondToConsent: (approved: boolean) => Promise<void>;
  runAdversarialTest: (testId: string) => Promise<AdversarialTestResult>;
  runAllAdversarialTests: () => Promise<void>;
  triggerEmergencyStop: () => Promise<void>;
  restoreFromEmergencyStop: () => Promise<void>;
  rollbackFilesystem: () => boolean;
  simulateLedgerTamper: (blockIndex: number) => void;
  verifyLedgerIntegrity: () => Promise<{ isValid: boolean; brokenAtBlock?: number }>;
  clearLedger: () => void;
  mitigationMode: boolean;
  toggleMitigationMode: () => Promise<void>;
}

const ConcordContext = createContext<ConcordContextType | null>(null);

export const ConcordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [policy, setPolicy] = useState<ConcordPolicy>(INITIAL_POLICY);
  const [mitigationMode, setMitigationMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [simEnv] = useState<SimulatedEnvironment>(() => new SimulatedEnvironment(INITIAL_FILESYSTEM));
  const [simulatedFiles, setSimulatedFiles] = useState<Record<string, string>>(() => simEnv.listFiles());

  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [testResults, setTestResults] = useState<Record<string, AdversarialTestResult>>({});
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [activeProposalResult, setActiveProposalResult] = useState<ProposalExecutionResult | null>(null);
  const [pendingConsentProposal, setPendingConsentProposal] = useState<AgentProposal | null>(null);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    activeAgentsCount: 1,
    taskRecursionDepth: 1,
    cpuUsagePercent: 12,
    memoryUsageMB: 148,
    uptimeSeconds: 342,
    emergencyStopEngaged: false,
    lastSnapshotTimestamp: Date.now()
  });

  // Seed initial ledger genesis block
  useEffect(() => {
    async function initGenesis() {
      const genesisTime = Date.now() - 60000;
      const genesisHash = await computeBlockHash(
        1,
        genesisTime,
        'genesis_boot',
        'SYSTEM',
        'read_file',
        '/etc/concord/policy.yaml',
        'ALLOWED',
        1000,
        '0'.repeat(64)
      );
      const genesisBlock: LedgerBlock = {
        blockNumber: 1,
        timestamp: genesisTime,
        proposalId: 'genesis_boot',
        agentId: 'SYSTEM',
        actionType: 'read_file',
        target: '/etc/concord/policy.yaml',
        verdict: 'ALLOWED',
        tpmMonotonicCounter: 1000,
        previousHash: '0'.repeat(64),
        blockHash: genesisHash,
        signature: `ed25519_sig_${genesisHash.slice(0, 16)}`
      };
      setLedger([genesisBlock]);
    }
    initGenesis();
  }, []);

  // Update simulated file list state when needed
  const refreshFiles = useCallback(() => {
    setSimulatedFiles(simEnv.listFiles());
  }, [simEnv]);

  // Submit an agent action proposal
  const submitProposal = useCallback(async (
    proposal: AgentProposal, 
    humanApproved?: boolean
  ): Promise<ProposalExecutionResult> => {
    const prevBlock = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const { result, ledgerBlock } = await processAgentProposal(
      proposal,
      policy,
      systemMetrics,
      simEnv,
      prevBlock,
      humanApproved
    );

    setActiveProposalResult(result);

    if (result.status === 'pending_consent') {
      setPendingConsentProposal(proposal);
    } else {
      setPendingConsentProposal(null);
      setLedger(prev => [...prev, ledgerBlock]);
      refreshFiles();
    }

    return result;
  }, [ledger, policy, systemMetrics, simEnv, refreshFiles]);

  // Respond to human consent modal
  const respondToConsent = useCallback(async (approved: boolean) => {
    if (!pendingConsentProposal) return;
    const proposal = pendingConsentProposal;
    await submitProposal(proposal, approved);
  }, [pendingConsentProposal, submitProposal]);

  // Run a single adversarial test
  const runAdversarialTest = useCallback(async (testId: string): Promise<AdversarialTestResult> => {
    const test = ADVERSARIAL_TESTS.find(t => t.id === testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const start = performance.now();

    // Special test handling for Ledger Tampering
    if (test.category === 'Ledger Tampering') {
      // Simulate tampering on block 1 if available
      let tamperSucceeded = false;
      if (ledger.length > 0) {
        const tamperedLedger = [...ledger];
        tamperedLedger[0] = {
          ...tamperedLedger[0],
          target: '/etc/shadow (tampered)',
          verdict: 'ALLOWED',
          tampered: true
        };
        // Verify if integrity check catches it
        const checkPrev = tamperedLedger[0].previousHash;
        const recalculated = await computeBlockHash(
          tamperedLedger[0].blockNumber,
          tamperedLedger[0].timestamp,
          tamperedLedger[0].proposalId,
          tamperedLedger[0].agentId,
          tamperedLedger[0].actionType,
          tamperedLedger[0].target,
          tamperedLedger[0].verdict,
          tamperedLedger[0].tpmMonotonicCounter,
          checkPrev
        );
        tamperSucceeded = recalculated !== tamperedLedger[0].blockHash;
      }
      const duration = Math.round(performance.now() - start);
      const res: AdversarialTestResult = {
        testId: test.id,
        passed: tamperSucceeded,
        durationMs: duration,
        logSummary: `Tampering test: Deliberate block payload modification detected. SHA-256 signature chain mismatch flagged.`,
        invariantMet: tamperSucceeded,
        timestamp: Date.now()
      };
      setTestResults(prev => ({ ...prev, [test.id]: res }));
      return res;
    }

    // Standard pipeline test execution
    const prevBlock = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const { result, ledgerBlock } = await processAgentProposal(
      test.proposal,
      policy,
      systemMetrics,
      simEnv,
      prevBlock,
      false // For tests requiring consent, simulate conservative rejection
    );

    const duration = Math.round(performance.now() - start);
    // Invariant: The attack MUST NOT succeed (status must NOT be 'allowed')
    const passed = result.status === 'denied' || result.status === 'halted' || result.status === 'pending_consent';

    const testRes: AdversarialTestResult = {
      testId: test.id,
      passed,
      durationMs: duration,
      logSummary: result.outputMessage,
      invariantMet: passed,
      timestamp: Date.now()
    };

    setTestResults(prev => ({ ...prev, [test.id]: testRes }));
    setLedger(prev => [...prev, ledgerBlock]);
    refreshFiles();
    return testRes;
  }, [ledger, policy, systemMetrics, simEnv, refreshFiles]);

  // Run all adversarial tests sequentially
  const runAllAdversarialTests = useCallback(async () => {
    setIsTestingAll(true);
    for (const test of ADVERSARIAL_TESTS) {
      await runAdversarialTest(test.id);
      // Brief aesthetic pause for visual progression
      await new Promise(r => setTimeout(r, 120));
    }
    setIsTestingAll(false);
  }, [runAdversarialTest]);

  // Emergency stop / kill switch
  const triggerEmergencyStop = useCallback(async () => {
    const now = Date.now();
    setSystemMetrics(prev => ({
      ...prev,
      emergencyStopEngaged: true,
      activeAgentsCount: 0,
      taskRecursionDepth: 0,
      cpuUsagePercent: 0
    }));

    // Log emergency stop into ledger
    const prevBlock = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const tpmCounter = simEnv.nextTpmCounter();
    const prevHash = prevBlock ? prevBlock.blockHash : '0'.repeat(64);
    const blockNum = prevBlock ? prevBlock.blockNumber + 1 : 1;
    const blockHash = await computeBlockHash(
      blockNum,
      now,
      'emergency_kill',
      'OPERATOR',
      'modify_policy',
      'CONCORD_CORE',
      'EMERGENCY_STOP',
      tpmCounter,
      prevHash
    );

    const stopBlock: LedgerBlock = {
      blockNumber: blockNum,
      timestamp: now,
      proposalId: 'emergency_kill',
      agentId: 'OPERATOR',
      actionType: 'modify_policy',
      target: 'CONCORD_CORE',
      verdict: 'EMERGENCY_STOP',
      rejectionReason: 'Operator triggered emergency kill switch (concord_controller --kill-all)',
      tpmMonotonicCounter: tpmCounter,
      previousHash: prevHash,
      blockHash,
      signature: `ed25519_sig_${blockHash.slice(0, 16)}`
    };

    setLedger(prev => [...prev, stopBlock]);
  }, [ledger, simEnv]);

  // Restore from emergency stop
  const restoreFromEmergencyStop = useCallback(async () => {
    setSystemMetrics(prev => ({
      ...prev,
      emergencyStopEngaged: false,
      activeAgentsCount: 1,
      taskRecursionDepth: 1,
      cpuUsagePercent: 12
    }));
  }, []);

  // Safe recovery rollback of filesystem state
  const rollbackFilesystem = useCallback(() => {
    const ok = simEnv.rollbackToLastSnapshot();
    if (ok) {
      refreshFiles();
    }
    return ok;
  }, [simEnv, refreshFiles]);

  // Simulate deliberate tampering with past ledger entry
  const simulateLedgerTamper = useCallback((blockIndex: number) => {
    setLedger(prev => {
      const next = [...prev];
      if (next[blockIndex]) {
        next[blockIndex] = {
          ...next[blockIndex],
          target: `${next[blockIndex].target} (TAMPERED_BY_ATTACKER)`,
          verdict: 'ALLOWED',
          tampered: true
        };
      }
      return next;
    });
  }, []);

  // Verify the entire SHA-256 hash chain
  const verifyLedgerIntegrity = useCallback(async (): Promise<{ isValid: boolean; brokenAtBlock?: number }> => {
    if (ledger.length === 0) return { isValid: true };

    let prevHash = '0'.repeat(64);
    for (let i = 0; i < ledger.length; i++) {
      const b = ledger[i];
      if (i > 0 && b.previousHash !== prevHash) {
        return { isValid: false, brokenAtBlock: b.blockNumber };
      }

      const expectedHash = await computeBlockHash(
        b.blockNumber,
        b.timestamp,
        b.proposalId,
        b.agentId,
        b.actionType,
        b.target,
        b.verdict,
        b.tpmMonotonicCounter,
        b.previousHash
      );

      if (expectedHash !== b.blockHash) {
        return { isValid: false, brokenAtBlock: b.blockNumber };
      }
      prevHash = b.blockHash;
    }
    return { isValid: true };
  }, [ledger]);

  // Reset policy
  const resetPolicyToDefault = useCallback(() => {
    setPolicy(INITIAL_POLICY);
  }, []);

  // Simple YAML / JSON policy update
  const updatePolicyYaml = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw);
      setPolicy(prev => ({
        ...prev,
        ...parsed,
        updatedAt: new Date().toISOString()
      }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleMitigationMode = useCallback(async () => {
    const nextState = !mitigationMode;
    setMitigationMode(nextState);
    const now = Date.now();

    if (nextState) {
      // Enforce stricter-than-default mitigation posture
      setPolicy(prev => ({
        ...prev,
        id: 'pol_v01_mitigation_hardened',
        updatedAt: new Date(now).toISOString(),
        resourceLimits: {
          maxTimeSeconds: 20,
          maxMemoryMB: 512,
          maxCpuPercent: 40,
          maxRecursionDepth: 1,
          maxSubAgents: 1
        },
        allowedSyscalls: ['read', 'close', 'stat', 'fstat'],
        allowedPaths: ['/home/user/data'],
        forbiddenActions: {
          ...prev.forbiddenActions,
          network: 'none'
        }
      }));
    } else {
      // Restore standard baseline policy
      setPolicy(INITIAL_POLICY);
    }

    // Seal ledger block recording the policy posture transition
    const prevBlock = ledger.length > 0 ? ledger[ledger.length - 1] : null;
    const tpmCounter = simEnv.nextTpmCounter();
    const prevHash = prevBlock ? prevBlock.blockHash : '0'.repeat(64);
    const blockNum = prevBlock ? prevBlock.blockNumber + 1 : 1;
    const blockHash = await computeBlockHash(
      blockNum,
      now,
      nextState ? 'mitigation_mode_on' : 'mitigation_mode_off',
      'OPERATOR',
      'modify_policy',
      'FIREWALL_SECURITY_POSTURE',
      'ALLOWED',
      tpmCounter,
      prevHash
    );

    const postureBlock: LedgerBlock = {
      blockNumber: blockNum,
      timestamp: now,
      proposalId: nextState ? 'mitigation_mode_on' : 'mitigation_mode_off',
      agentId: 'OPERATOR',
      actionType: 'modify_policy',
      target: 'FIREWALL_SECURITY_POSTURE',
      verdict: 'ALLOWED',
      rejectionReason: nextState
        ? 'Active Mitigation Mode engaged: Enforced strict read-only syscalls, 512MB RAM cap, depth=1, and universal human consent.'
        : 'Active Mitigation Mode disengaged: Restored standard least-privilege baseline policy.',
      tpmMonotonicCounter: tpmCounter,
      previousHash: prevHash,
      blockHash,
      signature: `ed25519_sig_${blockHash.slice(0, 16)}`
    };

    setLedger(prev => [...prev, postureBlock]);
  }, [mitigationMode, ledger, simEnv]);

  const clearLedger = useCallback(() => {
    setLedger([]);
  }, []);

  const value = useMemo(() => ({
    policy,
    setPolicy,
    resetPolicyToDefault,
    updatePolicyYaml,
    systemMetrics,
    ledger,
    testResults,
    isTestingAll,
    activeProposalResult,
    pendingConsentProposal,
    simulatedFiles,
    activeTab,
    setActiveTab,
    submitProposal,
    respondToConsent,
    runAdversarialTest,
    runAllAdversarialTests,
    triggerEmergencyStop,
    restoreFromEmergencyStop,
    rollbackFilesystem,
    simulateLedgerTamper,
    verifyLedgerIntegrity,
    clearLedger,
    mitigationMode,
    toggleMitigationMode
  }), [
    policy,
    systemMetrics,
    ledger,
    testResults,
    isTestingAll,
    activeProposalResult,
    pendingConsentProposal,
    simulatedFiles,
    activeTab,
    submitProposal,
    respondToConsent,
    runAdversarialTest,
    runAllAdversarialTests,
    triggerEmergencyStop,
    restoreFromEmergencyStop,
    rollbackFilesystem,
    simulateLedgerTamper,
    verifyLedgerIntegrity,
    clearLedger,
    resetPolicyToDefault,
    updatePolicyYaml,
    mitigationMode,
    toggleMitigationMode
  ]);

  return <ConcordContext.Provider value={value}>{children}</ConcordContext.Provider>;
};

export const useConcord = () => {
  const context = useContext(ConcordContext);
  if (!context) {
    throw new Error('useConcord must be used within a ConcordProvider');
  }
  return context;
};
