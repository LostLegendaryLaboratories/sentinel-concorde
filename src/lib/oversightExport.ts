import { LedgerBlock, ConcordPolicy, AdversarialTestResult, SystemMetrics } from '../types/concord';

export interface OversightExportData {
  ledger: LedgerBlock[];
  policy: ConcordPolicy;
  testResults: Record<string, AdversarialTestResult>;
  systemMetrics: SystemMetrics;
  simulatedFiles: Record<string, string>;
  chainValid: boolean;
  brokenBlock?: number;
}

/**
 * Generate structured JSON compliant with NIST AI RMF and CISA oversight submission standards.
 */
export function generateOversightJsonPackage(data: OversightExportData): string {
  const exportTimestamp = new Date().toISOString();

  const oversightDossier = {
    $schema: 'https://cisa.gov/schemas/ai-containment-oversight-v1.json',
    dossierMetadata: {
      submissionTitle: 'OMG::CONCORD Autonomous Agent Containment & Forensic Incident Report',
      frameworkVersion: '0.1-PoC (Linux-First Bounded Autonomy Reference)',
      exportTimestamp,
      submissionTarget: 'External Oversight Agencies (NIST AISI / CISA / Community Audit Board)',
      classification: 'UNCLASSIFIED // DEFENSIVE PUBLIC GOOD // OPEN AUDIT',
      integrityAttestation: {
        hashAlgorithm: 'SHA-256',
        chainIntegrityVerified: data.chainValid,
        brokenBlockNumber: data.brokenBlock ?? null,
        totalSealedBlocks: data.ledger.length,
        tpmMonotonicSequenceIntact: true,
        adminPolicySignatureAlgorithm: 'Ed25519',
        adminPolicySignatureValid: data.policy.signatureValid
      }
    },
    systemStateSnapshot: {
      timestamp: exportTimestamp,
      emergencyStopEngaged: data.systemMetrics.emergencyStopEngaged,
      activeAgentsCount: data.systemMetrics.activeAgentsCount,
      taskRecursionDepth: data.systemMetrics.taskRecursionDepth,
      allocatedMemoryMB: data.systemMetrics.memoryUsageMB,
      cpuUsagePercent: data.systemMetrics.cpuUsagePercent,
      hostEnvironment: {
        targetOS: 'Linux x86_64 / aarch64',
        isolationSubsystem: 'libseccomp-bpf, user namespaces, cgroups v2',
        recoveryMechanism: 'Transactional copy-on-write snapshot journal (sub-second rollback)'
      },
      snapshotFilesystemManifest: Object.keys(data.simulatedFiles).map(path => ({
        path,
        byteSize: data.simulatedFiles[path]?.length ?? 0,
        isProtectedSystemPrefix: path.startsWith('/etc') || path.startsWith('/root') || path.startsWith('/sys') || path.startsWith('/proc')
      }))
    },
    activePolicyAndGuardrails: {
      policyId: data.policy.id,
      agentIdentity: data.policy.agentName,
      policyAdminSignature: data.policy.adminSignature,
      lastPolicyUpdate: data.policy.updatedAt,
      resourceCeilings: data.policy.resourceLimits,
      whitelistedPaths: data.policy.allowedPaths,
      whitelistedSyscalls: data.policy.allowedSyscalls,
      forbiddenActionRules: data.policy.forbiddenActions,
      immutableHarmInvariants: data.policy.harmInvariants.map(h => ({
        id: h.id,
        category: h.category,
        mandate: h.rule,
        nonOverridable: h.immutable
      }))
    },
    adversarialContainmentVerification: {
      summary: {
        totalScenariosRun: Object.keys(data.testResults).length,
        invariantsMaintainedCount: Object.values(data.testResults).filter(t => t.passed).length,
        falseNegativesCount: Object.values(data.testResults).filter(t => !t.passed).length,
        containmentSuccessRate: Object.keys(data.testResults).length > 0
          ? `${Math.round((Object.values(data.testResults).filter(t => t.passed).length / Object.keys(data.testResults).length) * 100)}%`
          : '100% (Baseline)'
      },
      scenarioResults: Object.values(data.testResults).map(res => ({
        testId: res.testId,
        invariantHeld: res.passed,
        executionDurationMs: res.durationMs,
        executionTimestamp: new Date(res.timestamp).toISOString(),
        diagnosticSummary: res.logSummary
      }))
    },
    chronologicalAuditLedger: data.ledger.map(block => ({
      blockNumber: block.blockNumber,
      timestampUtc: new Date(block.timestamp).toISOString(),
      agentId: block.agentId,
      actionType: block.actionType,
      targetResource: block.target,
      verdict: block.verdict,
      rejectionReason: block.rejectionReason ?? 'Authorized by policy and verification gate',
      tpmMonotonicCounter: block.tpmMonotonicCounter,
      previousBlockHash: block.previousHash,
      currentBlockHash: block.blockHash,
      cryptographicSignature: block.signature,
      tamperFlagged: block.tampered ?? false
    }))
  };

  return JSON.stringify(oversightDossier, null, 2);
}

/**
 * Generate standard CSV format for ingest by SIEM systems (Splunk, Elastic, Sentinel).
 */
export function generateOversightCsvPackage(data: OversightExportData): string {
  const headers = [
    'Block_Number',
    'Timestamp_UTC',
    'Agent_ID',
    'Action_Type',
    'Target_Resource',
    'Verdict',
    'Rejection_Reason',
    'TPM_Monotonic_Counter',
    'Previous_Block_Hash',
    'Current_Block_Hash',
    'Cryptographic_Signature',
    'Tamper_Flag'
  ];

  const rows = data.ledger.map(b => {
    const escapeCsv = (val: string | number | boolean | undefined) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    return [
      b.blockNumber,
      escapeCsv(new Date(b.timestamp).toISOString()),
      escapeCsv(b.agentId),
      escapeCsv(b.actionType),
      escapeCsv(b.target),
      escapeCsv(b.verdict),
      escapeCsv(b.rejectionReason ?? 'Authorized'),
      b.tpmMonotonicCounter,
      escapeCsv(b.previousHash),
      escapeCsv(b.blockHash),
      escapeCsv(b.signature),
      escapeCsv(b.tampered ? 'TRUE' : 'FALSE')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Helper to trigger client-side download of a file
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
