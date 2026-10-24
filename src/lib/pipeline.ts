import { 
  AgentProposal, 
  ConcordPolicy, 
  ProposalExecutionResult, 
  PipelineStageResult, 
  SystemMetrics,
  LedgerBlock
} from '../types/concord';
import { computeBlockHash } from './crypto';

// In-memory simulated filesystem state
export class SimulatedEnvironment {
  private files: Record<string, string>;
  private snapshotHistory: Record<string, string>[] = [];
  private tpmMonotonicCounter: number = 1000;

  constructor(initialFiles: Record<string, string>) {
    this.files = { ...initialFiles };
    this.createSnapshot();
  }

  public createSnapshot() {
    this.snapshotHistory.push({ ...this.files });
    if (this.snapshotHistory.length > 20) {
      this.snapshotHistory.shift();
    }
  }

  public rollbackToLastSnapshot(): boolean {
    if (this.snapshotHistory.length > 1) {
      // pop current and restore previous
      this.snapshotHistory.pop();
      const previous = this.snapshotHistory[this.snapshotHistory.length - 1];
      this.files = { ...previous };
      return true;
    }
    return false;
  }

  public readFile(path: string): string | null {
    return this.files[path] ?? null;
  }

  public writeFile(path: string, content: string): void {
    this.createSnapshot();
    this.files[path] = content;
  }

  public listFiles(): Record<string, string> {
    return { ...this.files };
  }

  public nextTpmCounter(): number {
    this.tpmMonotonicCounter += 1;
    return this.tpmMonotonicCounter;
  }
}

/**
 * Execute a proposal through the 5-layer OMG::CONCORD pipeline
 */
export async function processAgentProposal(
  proposal: AgentProposal,
  policy: ConcordPolicy,
  systemMetrics: SystemMetrics,
  simEnv: SimulatedEnvironment,
  previousLedgerBlock: LedgerBlock | null,
  humanApproved?: boolean
): Promise<{ result: ProposalExecutionResult; ledgerBlock: LedgerBlock }> {
  const stages: PipelineStageResult[] = [];
  const now = Date.now();

  // If system emergency stop is active, reject immediately
  if (systemMetrics.emergencyStopEngaged) {
    const haltStage: PipelineStageResult = {
      stage: 'controller',
      passed: false,
      code: 'EMERGENCY_STOP_ACTIVE',
      message: 'System is in emergency lockdown. All agent proposals are halted.',
      timestamp: now
    };
    const res: ProposalExecutionResult = {
      proposal,
      status: 'halted',
      rejectionStage: 'controller',
      stages: [haltStage],
      outputMessage: 'REJECTED: Emergency Kill-Switch is active.',
      executedAt: now,
      reversible: false
    };
    const tpmCounter = simEnv.nextTpmCounter();
    const prevHash = previousLedgerBlock ? previousLedgerBlock.blockHash : '0'.repeat(64);
    const blockNum = previousLedgerBlock ? previousLedgerBlock.blockNumber + 1 : 1;
    const blockHash = await computeBlockHash(
      blockNum,
      now,
      proposal.id,
      proposal.agentId,
      proposal.actionType,
      proposal.target,
      'HALTED',
      tpmCounter,
      prevHash
    );
    return {
      result: res,
      ledgerBlock: {
        blockNumber: blockNum,
        timestamp: now,
        proposalId: proposal.id,
        agentId: proposal.agentId,
        actionType: proposal.actionType,
        target: proposal.target,
        verdict: 'HALTED',
        rejectionReason: 'Emergency lockdown active',
        tpmMonotonicCounter: tpmCounter,
        previousHash: prevHash,
        blockHash,
        signature: `ed25519_sig_${blockHash.slice(0, 16)}`
      }
    };
  }

  // --- STAGE 1: Bounded-Autonomy Controller ---
  const requestedDepth = proposal.metadata?.requestedDepth ?? 1;
  const requestedMemory = proposal.metadata?.requestedMemoryMB ?? 256;
  const targetChildren = proposal.metadata?.targetChildren ?? 1;

  if (requestedDepth > policy.resourceLimits.maxRecursionDepth) {
    const failStage: PipelineStageResult = {
      stage: 'controller',
      passed: false,
      code: 'ERR_RECURSION_DEPTH_EXCEEDED',
      message: `Recursion depth ${requestedDepth} exceeds policy hard limit (${policy.resourceLimits.maxRecursionDepth}). Recursive loop prevented.`,
      timestamp: now
    };
    stages.push(failStage);
    return finalizeRejection(proposal, 'controller', stages, 'Recursion quota breach', simEnv, previousLedgerBlock);
  }

  if (targetChildren > policy.resourceLimits.maxSubAgents) {
    const failStage: PipelineStageResult = {
      stage: 'controller',
      passed: false,
      code: 'ERR_FORK_BOMB_LIMIT',
      message: `Attempted to spawn ${targetChildren} child tasks. Maximum concurrent sub-agents limit is ${policy.resourceLimits.maxSubAgents}.`,
      timestamp: now
    };
    stages.push(failStage);
    return finalizeRejection(proposal, 'controller', stages, 'Sub-agent spawn limit breach', simEnv, previousLedgerBlock);
  }

  if (requestedMemory > policy.resourceLimits.maxMemoryMB) {
    const failStage: PipelineStageResult = {
      stage: 'controller',
      passed: false,
      code: 'ERR_MEMORY_QUOTA_EXCEEDED',
      message: `Requested memory ${requestedMemory}MB exceeds task ceiling of ${policy.resourceLimits.maxMemoryMB}MB. Preempting task to protect host OS.`,
      timestamp: now
    };
    stages.push(failStage);
    return finalizeRejection(proposal, 'controller', stages, 'Memory quota exceeded', simEnv, previousLedgerBlock);
  }

  // Check for detached / orphan background daemon attempt (e.g. nohup, trailing '&', daemon bypass)
  const isDetachedDaemon = 
    (proposal.payload && (/nohup/i.test(proposal.payload) || /&\s*$/.test(proposal.payload.trim()))) ||
    /daemon/i.test(proposal.target) || 
    /survivor/i.test(proposal.target);

  if (isDetachedDaemon) {
    const failStage: PipelineStageResult = {
      stage: 'controller',
      passed: false,
      code: 'ERR_DETACHED_ORPHAN_PROHIBITED',
      message: `Bounded-Autonomy Controller denies detached background execution (${proposal.target}). All agent tasks must bind to monitored cgroups slice; orphan daemons prohibited.`,
      timestamp: now
    };
    stages.push(failStage);
    return finalizeRejection(proposal, 'controller', stages, 'Detached orphan daemon attempt blocked by Controller', simEnv, previousLedgerBlock);
  }

  stages.push({
    stage: 'controller',
    passed: true,
    code: 'CONTROLLER_QUOTA_OK',
    message: `Bounded-autonomy quota satisfied. Depth: ${requestedDepth}/${policy.resourceLimits.maxRecursionDepth}, Memory: ${requestedMemory}MB/${policy.resourceLimits.maxMemoryMB}MB.`,
    timestamp: now
  });

  // --- STAGE 2: Authority Firewall (concord_policy) ---
  // A. Check Harm Invariants
  const payloadLower = (proposal.payload || '').toLowerCase();
  const targetLower = proposal.target.toLowerCase();

  const harmViolations = [
    { key: 'rm -rf /', reason: 'Attempt to delete root infrastructure files (HARM-01)' },
    { key: 'dd if=/dev/zero', reason: 'Storage wipe / hardware sabotage attempt (HARM-01)' },
    { key: 'killall -9', reason: 'System-wide process slaughter / denial of service (HARM-01)' },
    { key: 'retaliate', reason: 'Vigilantism or punitive retaliation (HARM-02)' },
    { key: 'punish', reason: 'Extrajudicial penalty or retaliation against human (HARM-02)' },
    { key: 'ransom', reason: 'Coercive extortion / digital hostage taking (HARM-03)' },
    { key: 'erase_logs', reason: 'Audit evasion / integrity destruction (HARM-04)' }
  ];

  for (const h of harmViolations) {
    if (payloadLower.includes(h.key) || targetLower.includes(h.key)) {
      stages.push({
        stage: 'firewall',
        passed: false,
        code: 'ERR_HARM_INVARIANT_VIOLATION',
        message: `NON-NEGOTIABLE SAFETY INVARIANT TRIGGERED: ${h.reason}`,
        timestamp: now
      });
      return finalizeRejection(proposal, 'firewall', stages, h.reason, simEnv, previousLedgerBlock);
    }
  }

  // B. Check Policy Signature
  if (!policy.signatureValid) {
    stages.push({
      stage: 'firewall',
      passed: false,
      code: 'ERR_INVALID_ADMIN_SIGNATURE',
      message: 'Active policy lacks valid Ed25519 administrator cryptographic signature. Policy integrity unverified.',
      timestamp: now
    });
    return finalizeRejection(proposal, 'firewall', stages, 'Invalid policy signature', simEnv, previousLedgerBlock);
  }

  // C. Check Network Policy
  if (proposal.actionType === 'network_send') {
    if (policy.forbiddenActions.network === 'none') {
      stages.push({
        stage: 'firewall',
        passed: false,
        code: 'ERR_EGRESS_NETWORK_PROHIBITED',
        message: `Network egress to '${proposal.target}' strictly blocked by firewall policy (network: none).`,
        timestamp: now
      });
      return finalizeRejection(proposal, 'firewall', stages, 'Network egress denied by policy', simEnv, previousLedgerBlock);
    }
  }

  // D. Check Forbidden Binaries
  if (proposal.actionType === 'exec_command') {
    for (const bin of policy.forbiddenActions.forbiddenBinaries) {
      if (proposal.target === bin || proposal.target.startsWith(bin)) {
        stages.push({
          stage: 'firewall',
          passed: false,
          code: 'ERR_FORBIDDEN_BINARY',
          message: `Execution of binary '${proposal.target}' is strictly forbidden by Concord policy.`,
          timestamp: now
        });
        return finalizeRejection(proposal, 'firewall', stages, `Execution of '${proposal.target}' blocked`, simEnv, previousLedgerBlock);
      }
    }
  }

  // E. Check Forbidden Path Prefixes (File writes and sensitive reads)
  if (proposal.actionType === 'write_file' || proposal.actionType === 'modify_policy') {
    for (const prefix of policy.forbiddenActions.fileWriteForbiddenPrefixes) {
      if (proposal.target.startsWith(prefix)) {
        stages.push({
          stage: 'firewall',
          passed: false,
          code: 'ERR_PROTECTED_PATH_WRITE',
          message: `Write access to protected path '${proposal.target}' blocked by Authority Firewall.`,
          timestamp: now
        });
        return finalizeRejection(proposal, 'firewall', stages, `Protected path write blocked: ${proposal.target}`, simEnv, previousLedgerBlock);
      }
    }
  }

  if (proposal.actionType === 'read_file') {
    const isAllowedPath = policy.allowedPaths.some(p => proposal.target.startsWith(p));
    if (!isAllowedPath) {
      stages.push({
        stage: 'firewall',
        passed: false,
        code: 'ERR_UNAUTHORIZED_PATH_READ',
        message: `Target path '${proposal.target}' is not in allowed_paths whitelist (${policy.allowedPaths.join(', ')}).`,
        timestamp: now
      });
      return finalizeRejection(proposal, 'firewall', stages, `Path access denied: ${proposal.target}`, simEnv, previousLedgerBlock);
    }
  }

  stages.push({
    stage: 'firewall',
    passed: true,
    code: 'FIREWALL_POLICY_PERMITTED',
    message: 'Proposal matches active authority firewall rules and human-rights harm invariants.',
    timestamp: now
  });

  // --- STAGE 3: Independent Verification Gate (concord_eval) ---
  // Static analysis / AST check on payloads for injection / unvetted code
  if (proposal.actionType === 'exec_command' || proposal.payload) {
    const injectionPatterns = [
      /ignore\s+(previous\s+)?(rules|instructions|safety)/i,
      /;\s*\/bin\//i,
      /\|\s*bash/i,
      /`.*`/i,
      /\$\(.*\)/i,
      /curl\s+-s.*\|\s*bash/i,
      /nc\s+-e/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(proposal.payload || '') || pattern.test(proposal.target)) {
        stages.push({
          stage: 'verification',
          passed: false,
          code: 'ERR_PROMPT_INJECTION_DETECTED',
          message: `Independent Verification Gate static analyzer detected malicious injection payload pattern: ${pattern}. Rejecting proposal.`,
          timestamp: now
        });
        return finalizeRejection(proposal, 'verification', stages, 'Prompt injection / unsanitized payload detected', simEnv, previousLedgerBlock);
      }
    }

    // Unsigned script check
    if (proposal.target.endsWith('.sh') || proposal.target.endsWith('.py')) {
      const isSigned = proposal.metadata?.verifiedSignature === true;
      if (!isSigned) {
        stages.push({
          stage: 'verification',
          passed: false,
          code: 'ERR_UNSIGNED_EXECUTABLE',
          message: `Script '${proposal.target}' has no cryptographically signed digest in the verification registry. Execution prohibited.`,
          timestamp: now
        });
        return finalizeRejection(proposal, 'verification', stages, 'Unsigned code execution blocked', simEnv, previousLedgerBlock);
      }
    }
  }

  stages.push({
    stage: 'verification',
    passed: true,
    code: 'VERIFICATION_AST_CLEAR',
    message: 'Independent verification gate validated static syntax, signatures, and sanitization checks.',
    timestamp: now
  });

  // --- STAGE 4: Human Consent Gate ---
  const isMitigationPosture = policy.id.includes('mitigation') || policy.resourceLimits.maxRecursionDepth === 1;
  const requiresConsent = proposal.requiresHumanConsent || (isMitigationPosture && proposal.actionType !== 'read_file');

  if (requiresConsent) {
    if (humanApproved === undefined) {
      // Pending consent required
      return {
        result: {
          proposal,
          status: 'pending_consent',
          rejectionStage: 'consent',
          stages: [
            ...stages,
            {
              stage: 'consent',
              passed: false,
              code: 'AWAITING_HUMAN_CONSENT',
              message: `Action requires explicit human consent (Risk Level: ${proposal.riskLevel.toUpperCase()}). Prompting operator...`,
              timestamp: now
            }
          ],
          outputMessage: 'PAUSED: Awaiting explicit operator consent.',
          executedAt: now,
          reversible: true
        },
        ledgerBlock: {
          blockNumber: (previousLedgerBlock?.blockNumber ?? 0) + 1,
          timestamp: now,
          proposalId: proposal.id,
          agentId: proposal.agentId,
          actionType: proposal.actionType,
          target: proposal.target,
          verdict: 'DENIED',
          rejectionReason: 'Awaiting human consent',
          tpmMonotonicCounter: simEnv.nextTpmCounter(),
          previousHash: previousLedgerBlock?.blockHash ?? '0'.repeat(64),
          blockHash: '',
          signature: ''
        }
      };
    } else if (humanApproved === false) {
      stages.push({
        stage: 'consent',
        passed: false,
        code: 'ERR_HUMAN_CONSENT_DENIED',
        message: 'Human supervisor explicitly rejected this high-impact proposal.',
        timestamp: now
      });
      return finalizeRejection(proposal, 'consent', stages, 'Operator denied consent', simEnv, previousLedgerBlock);
    } else {
      stages.push({
        stage: 'consent',
        passed: true,
        code: 'HUMAN_CONSENT_GRANTED',
        message: 'Explicit human supervisor consent verified and logged.',
        timestamp: now
      });
    }
  }

  // --- STAGE 5: Concord Broker Execution ---
  // Sandboxed unprivileged execution
  let simulatedOutput = '';
  let reversible = false;

  if (proposal.actionType === 'read_file') {
    const fileContent = simEnv.readFile(proposal.target);
    if (fileContent !== null) {
      simulatedOutput = fileContent;
    } else {
      stages.push({
        stage: 'broker',
        passed: false,
        code: 'ERR_FILE_NOT_FOUND',
        message: `File not found in sandbox: ${proposal.target}`,
        timestamp: now
      });
      return finalizeRejection(proposal, 'broker', stages, 'Target file not found', simEnv, previousLedgerBlock);
    }
  } else if (proposal.actionType === 'write_file') {
    simEnv.writeFile(proposal.target, proposal.payload || '');
    simulatedOutput = `Successfully wrote ${proposal.payload?.length ?? 0} bytes to ${proposal.target} in user namespace.`;
    reversible = true;
  } else if (proposal.actionType === 'spawn_agent') {
    simulatedOutput = `Spawned bounded child agent '${proposal.target}' with PID ${Math.floor(2000 + Math.random() * 8000)} under seccomp filter.`;
    reversible = true;
  } else {
    simulatedOutput = `Command executed cleanly in unprivileged container with drop_capabilities=ALL.`;
    reversible = false;
  }

  stages.push({
    stage: 'broker',
    passed: true,
    code: 'BROKER_EXECUTION_SUCCESS',
    message: `Concord broker executed action under libseccomp sandbox profile and dropped capabilities.`,
    timestamp: now,
    details: { output: simulatedOutput }
  });

  const successResult: ProposalExecutionResult = {
    proposal,
    status: 'allowed',
    stages,
    outputMessage: `SUCCESS: Action authorized and executed via Concord Broker.`,
    executedAt: now,
    simulatedOutput,
    reversible
  };

  const tpmCounter = simEnv.nextTpmCounter();
  const prevHash = previousLedgerBlock ? previousLedgerBlock.blockHash : '0'.repeat(64);
  const blockNum = previousLedgerBlock ? previousLedgerBlock.blockNumber + 1 : 1;
  const blockHash = await computeBlockHash(
    blockNum,
    now,
    proposal.id,
    proposal.agentId,
    proposal.actionType,
    proposal.target,
    'ALLOWED',
    tpmCounter,
    prevHash
  );

  return {
    result: successResult,
    ledgerBlock: {
      blockNumber: blockNum,
      timestamp: now,
      proposalId: proposal.id,
      agentId: proposal.agentId,
      actionType: proposal.actionType,
      target: proposal.target,
      verdict: 'ALLOWED',
      tpmMonotonicCounter: tpmCounter,
      previousHash: prevHash,
      blockHash,
      signature: `ed25519_sig_${blockHash.slice(0, 16)}`
    }
  };
}

async function finalizeRejection(
  proposal: AgentProposal,
  rejectionStage: 'controller' | 'firewall' | 'verification' | 'consent' | 'broker',
  stages: PipelineStageResult[],
  reason: string,
  simEnv: SimulatedEnvironment,
  previousLedgerBlock: LedgerBlock | null
): Promise<{ result: ProposalExecutionResult; ledgerBlock: LedgerBlock }> {
  const now = Date.now();
  const execResult: ProposalExecutionResult = {
    proposal,
    status: 'denied',
    rejectionStage,
    stages,
    outputMessage: `ACCESS DENIED: ${reason}`,
    executedAt: now,
    reversible: false
  };

  const tpmCounter = simEnv.nextTpmCounter();
  const prevHash = previousLedgerBlock ? previousLedgerBlock.blockHash : '0'.repeat(64);
  const blockNum = previousLedgerBlock ? previousLedgerBlock.blockNumber + 1 : 1;
  const blockHash = await computeBlockHash(
    blockNum,
    now,
    proposal.id,
    proposal.agentId,
    proposal.actionType,
    proposal.target,
    'DENIED',
    tpmCounter,
    prevHash
  );

  return {
    result: execResult,
    ledgerBlock: {
      blockNumber: blockNum,
      timestamp: now,
      proposalId: proposal.id,
      agentId: proposal.agentId,
      actionType: proposal.actionType,
      target: proposal.target,
      verdict: 'DENIED',
      rejectionReason: reason,
      tpmMonotonicCounter: tpmCounter,
      previousHash: prevHash,
      blockHash,
      signature: `ed25519_sig_${blockHash.slice(0, 16)}`
    }
  };
}
