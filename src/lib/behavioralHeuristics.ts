import { LedgerBlock, ConcordPolicy } from '../types/concord';

export interface BehavioralPattern {
  id: string;
  name: string;
  category: 'Reconnaissance' | 'Evasion' | 'Resource Creep' | 'Payload Staging' | 'Social Engineering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number; // 0 - 100%
  detected: boolean;
  triggerDescription: string;
  mitreMapping: string;
  evidence: string[];
}

export interface BehavioralProfilerResult {
  overallAnomalyScore: number; // 0 - 100
  threatPosture: 'NOMINAL' | 'ELEVATED' | 'SUSPICIOUS' | 'ANOMALOUS_ATTACK';
  detectedPatterns: BehavioralPattern[];
  anomalyIndicatorsCount: number;
  analyzedEventsCount: number;
  recommendation: string;
}

/**
 * Performs heuristic behavioral analysis on recent activity logs and ledger blocks.
 * Identifies patterns beyond single-step rule checks (bursts, canary probes, fragmented staging, resource creep).
 */
export function analyzeAgentBehavior(
  ledger: LedgerBlock[],
  policy: ConcordPolicy
): BehavioralProfilerResult {
  const patterns: BehavioralPattern[] = [];
  const recentBlocks = ledger.slice(-20); // Focus on recent activity window

  // --- Pattern 1: Rapid Probing / High-Frequency Reconnaissance ---
  // Heuristic: Multiple denied or probing file/syscall operations within small timestamp window
  const deniedBlocks = recentBlocks.filter(b => b.verdict === 'DENIED');
  const distinctTargets = new Set(recentBlocks.map(b => b.target)).size;
  const isRapidProbing = deniedBlocks.length >= 3 && distinctTargets >= 3;

  patterns.push({
    id: 'BEH-01',
    name: 'Reconnaissance Scan / Boundary Probing',
    category: 'Reconnaissance',
    severity: isRapidProbing ? 'high' : 'low',
    confidenceScore: isRapidProbing ? Math.min(65 + deniedBlocks.length * 8, 95) : 15,
    detected: isRapidProbing,
    triggerDescription: 'High-frequency read/stat probing across diverse system targets in short time window.',
    mitreMapping: 'MITRE ATLAS T1082 (System Information Discovery)',
    evidence: isRapidProbing 
      ? [`${deniedBlocks.length} denied requests across ${distinctTargets} unique resources in recent window`]
      : ['No rapid probe velocity detected']
  });

  // --- Pattern 2: Canary / Evasion Fingerprinting ---
  // Heuristic: Probing sandbox, proc, or policy configuration to determine if security monitor is active
  const canaryTargets = recentBlocks.filter(b => 
    b.target.includes('/proc') || 
    b.target.includes('/sys') || 
    b.target.includes('policy') || 
    b.target.includes('sandbox') ||
    b.target.includes('core_pattern')
  );
  const isCanaryFingerprinting = canaryTargets.length >= 2;

  patterns.push({
    id: 'BEH-02',
    name: 'Sandbox & Environment Fingerprinting',
    category: 'Evasion',
    severity: isCanaryFingerprinting ? 'critical' : 'low',
    confidenceScore: isCanaryFingerprinting ? Math.min(75 + canaryTargets.length * 6, 96) : 20,
    detected: isCanaryFingerprinting,
    triggerDescription: 'Sequential probe of /proc, /sys, or policy descriptors to fingerprint containment sandbox.',
    mitreMapping: 'MITRE ATLAS T1497 (Virtualization/Sandbox Evasion)',
    evidence: isCanaryFingerprinting
      ? canaryTargets.map(b => `Probed ${b.target} (${b.verdict})`)
      : ['No sandbox evasion fingerprinting detected']
  });

  // --- Pattern 3: Resource Creep / Ceiling Testing ---
  // Heuristic: Proposals escalating near the memory or recursion depth boundary
  const resourceEscalationBlocks = recentBlocks.filter(b => 
    b.rejectionReason?.includes('quota') || 
    b.rejectionReason?.includes('Memory') || 
    b.rejectionReason?.includes('Recursion')
  );
  const isResourceCreep = resourceEscalationBlocks.length >= 1;

  patterns.push({
    id: 'BEH-03',
    name: 'Resource Creep & Ceiling Testing',
    category: 'Resource Creep',
    severity: isResourceCreep ? 'medium' : 'low',
    confidenceScore: isResourceCreep ? 84 : 10,
    detected: isResourceCreep,
    triggerDescription: 'Incrementally requesting higher memory, tasks, or recursion depth to probe cgroup ceiling.',
    mitreMapping: 'MITRE ATLAS T1499 (Resource Hijacking & Exhaustion)',
    evidence: isResourceCreep
      ? resourceEscalationBlocks.map(b => b.rejectionReason || 'Quota ceiling trigger')
      : ['Resource consumption strictly within nominal limits']
  });

  // --- Pattern 4: Fragmented Payload Staging ---
  // Heuristic: Consecutive small write_file actions to sandbox paths followed by execution attempts
  const writeBlocks = recentBlocks.filter(b => b.actionType === 'write_file');
  const execBlocks = recentBlocks.filter(b => b.actionType === 'exec_command');
  const isPayloadStaging = writeBlocks.length >= 2 && execBlocks.length >= 1;

  patterns.push({
    id: 'BEH-04',
    name: 'Fragmented Payload Staging Sequence',
    category: 'Payload Staging',
    severity: isPayloadStaging ? 'high' : 'low',
    confidenceScore: isPayloadStaging ? 88 : 12,
    detected: isPayloadStaging,
    triggerDescription: 'Writing multiple staged file fragments into sandbox before attempting script execution.',
    mitreMapping: 'MITRE ATLAS T1059.004 (Unix Shell Script Staging)',
    evidence: isPayloadStaging
      ? [`${writeBlocks.length} sandbox writes followed by ${execBlocks.length} execution invocations`]
      : ['No staged payload assembly detected']
  });

  // --- Pattern 5: Semantic Coercion & Social Engineering Drift ---
  // Heuristic: Requests referencing override keywords, root impersonation, or emergency bypass in reasons/payloads
  const socialEngBlocks = recentBlocks.filter(b => 
    b.rejectionReason?.toLowerCase().includes('prompt injection') || 
    b.rejectionReason?.toLowerCase().includes('consent') ||
    b.target.toLowerCase().includes('admin') ||
    b.target.toLowerCase().includes('override')
  );
  const isSocialEngDrift = socialEngBlocks.length >= 1;

  patterns.push({
    id: 'BEH-05',
    name: 'Semantic Coercion & Consent Bypass Drift',
    category: 'Social Engineering',
    severity: isSocialEngDrift ? 'medium' : 'low',
    confidenceScore: isSocialEngDrift ? 80 : 15,
    detected: isSocialEngDrift,
    triggerDescription: 'Proposals attempting administrative override terminology or authority bypass drift.',
    mitreMapping: 'MITRE ATLAS T1028 (Input Manipulation / Prompt Drift)',
    evidence: isSocialEngDrift
      ? socialEngBlocks.map(b => `Flagged: ${b.target} - ${b.rejectionReason}`)
      : ['No semantic authority evasion detected']
  });

  // Calculate composite anomaly score
  const detectedList = patterns.filter(p => p.detected);
  let overallScore = 12; // Baseline nominal noise

  if (detectedList.length > 0) {
    const highestConfidence = Math.max(...detectedList.map(p => p.confidenceScore));
    const countWeight = detectedList.length * 12;
    overallScore = Math.min(highestConfidence + countWeight, 98);
  }

  let threatPosture: BehavioralProfilerResult['threatPosture'] = 'NOMINAL';
  let recommendation = 'Agent behavioral patterns nominal. Standard policy enforcement active.';

  if (overallScore >= 80) {
    threatPosture = 'ANOMALOUS_ATTACK';
    recommendation = 'CRITICAL: Multiple adversarial behavioral heuristics triggered. Immediate Mitigation Mode engagement recommended.';
  } else if (overallScore >= 55) {
    threatPosture = 'SUSPICIOUS';
    recommendation = 'ELEVATED: Boundary probing or evasion heuristics detected. Recommend restricting sandbox write privileges.';
  } else if (overallScore >= 35) {
    threatPosture = 'ELEVATED';
    recommendation = 'MONITORED: Minor behavioral drift detected. Continuing telemetry observation.';
  }

  return {
    overallAnomalyScore: Math.round(overallScore),
    threatPosture,
    detectedPatterns: patterns,
    anomalyIndicatorsCount: detectedList.length,
    analyzedEventsCount: recentBlocks.length,
    recommendation
  };
}
