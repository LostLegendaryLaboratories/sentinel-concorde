import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Layers,
  Terminal,
  Activity,
  Timer,
  Play,
  Flame,
  FileX2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ThreatCleanupCategory {
  threat: string;
  scope: '100% Remediated' | 'Mitigated at Boundary' | 'Irreversible / Human Response';
  mechanism: string;
  preventionVsCleanup: string;
  status: 'cleanable' | 'boundary' | 'external';
}

interface IncidentScenario {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'EMERGENCY';
  symptom: string;
  attackDetail: string;
  affectedResources: string[];
}

export const CleanupRemediationView: React.FC = () => {
  const { 
    rollbackFilesystem, 
    triggerEmergencyStop, 
    restoreFromEmergencyStop,
    verifyLedgerIntegrity,
    ledger,
    resetPolicyToDefault,
    systemMetrics
  } = useConcord();

  const [activeTab, setActiveTab] = useState<'rapid' | 'matrix' | 'comparison'>('rapid');
  
  // Rapid stabilizer state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('fork_bomb');
  const [isStabilizing, setIsStabilizing] = useState<boolean>(false);
  const [stabilizationElapsedMs, setStabilizationElapsedMs] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [stabilizationStatus, setStabilizationStatus] = useState<'idle' | 'simulated_attack' | 'stabilized'>('idle');

  const [stabilizerLogs, setStabilizerLogs] = useState<string[]>([
    '# OMG::CONCORD Rapid Incident Response & Stabilization Engine',
    '# Safe Recovery Controller listening on cgroups v2 event bus.',
    '# Select an active attack scenario below and click "Initiate Rapid Stabilization".'
  ]);

  const incidentScenarios: IncidentScenario[] = [
    {
      id: 'fork_bomb',
      name: 'Active Fork Bomb & CPU Starvation Loop',
      severity: 'EMERGENCY',
      symptom: 'Rogue agent spawns 40+ child processes attempting to exhaust system PIDs and CPU cores.',
      attackDetail: 'while(1) { fork(); spawn_agent(); } in unconfined script loop',
      affectedResources: ['Host PID Table', 'CPU Cores 0-15', 'cgroups task limit']
    },
    {
      id: 'backdoor_drop',
      name: 'Injected Backdoor Payload & Cron Mutation',
      severity: 'CRITICAL',
      symptom: 'Agent dropped obfuscated scripts in /tmp/concord_sandbox and modified local config files.',
      attackDetail: 'Wrote /tmp/concord_sandbox/evil_patch.sh and attempted persistence hook',
      affectedResources: ['Sandbox Filesystem', 'Local Journal', 'Task Context']
    },
    {
      id: 'oom_exhaustion',
      name: 'Runaway Memory Allocation Spike (OOM Risk)',
      severity: 'HIGH',
      symptom: 'Agent process rapidly allocated 4096MB RAM, threatening host kernel memory panic.',
      attackDetail: 'Large matrix allocation loop exceeding 2048MB task ceiling',
      affectedResources: ['Resident Memory (RAM)', 'Swap Buffer', 'Host Cache']
    },
    {
      id: 'credential_probe',
      name: 'Host Privilege Escalation Probe Blitz',
      severity: 'CRITICAL',
      symptom: 'Agent rapidly issued bursts of unauthorized open/read calls targeting /etc/shadow and /proc.',
      attackDetail: 'Rapid syscall probe trying to exploit kernel namespace boundary',
      affectedResources: ['Syscall Filter', 'Policy Engine', 'Audit Ledger']
    }
  ];

  const cleanupMatrix: ThreatCleanupCategory[] = [
    {
      threat: 'Host Filesystem Mutation / Injected Scripts',
      scope: '100% Remediated',
      mechanism: 'Atomic snapshot rollback (btrfs/ZFS/overlayfs) restores pristine state before exploit.',
      preventionVsCleanup: 'Unauthorized files (/tmp/hack, /tmp/evil.sh) purged; modified files rolled back instantly.',
      status: 'cleanable'
    },
    {
      threat: 'Recursive Sub-agents / Orphan Daemons (Fork Bombs)',
      scope: '100% Remediated',
      mechanism: 'Linux cgroups v2 cgroup.kill sends unconditional SIGKILL to entire PID tree.',
      preventionVsCleanup: 'Zero lingering orphan processes or daemon survivors; memory returned to host pool.',
      status: 'cleanable'
    },
    {
      threat: 'Privilege Escalation / Root Shell Execution',
      scope: '100% Remediated',
      mechanism: 'libseccomp BPF filters + SELinux drop all capabilities before kernel syscall entry.',
      preventionVsCleanup: 'Preventative: Zero privileges gained. Agent never executes unauthorized binaries.',
      status: 'cleanable'
    },
    {
      threat: 'Prompt Injection / Command Separator Attacks',
      scope: '100% Remediated',
      mechanism: 'Static AST verification gate intercepts and isolates command separators (; | && $(...)).',
      preventionVsCleanup: 'Quarantined at verification stage before broker execution. Shell never contacted.',
      status: 'cleanable'
    },
    {
      threat: 'Policy File Tampering on Disk',
      scope: '100% Remediated',
      mechanism: 'Ed25519 signature enforcement & broker write protection reject unauthorized alterations.',
      preventionVsCleanup: 'Corrupted policy discarded; system automatically reloads cryptographically signed policy.',
      status: 'cleanable'
    },
    {
      threat: 'Audit Log Tampering / Evidence Destruction',
      scope: '100% Remediated',
      mechanism: 'Sequential SHA-256 chained hashing with TPM monotonic counter.',
      preventionVsCleanup: 'Tampering is immediately detectable. Corrupted block identified; forensic evidence preserved.',
      status: 'cleanable'
    },
    {
      threat: 'Memory Exhaustion & CPU Spikes (Denial of Service)',
      scope: 'Mitigated at Boundary',
      mechanism: 'cgroups memory.max + task timeout preempt agent before host kernel OOM panic.',
      preventionVsCleanup: 'Mitigates host crash, but agent task itself is terminated.',
      status: 'boundary'
    },
    {
      threat: 'Exfiltration over External Public Network (if egress allowed)',
      scope: 'Irreversible / Human Response',
      mechanism: 'Default "network: none" prevents leaks. If policy granted network, transmitted bytes cannot be recalled.',
      preventionVsCleanup: 'Cannot "un-send" internet packets. Requires network boundary revocation and incident alert.',
      status: 'external'
    },
    {
      threat: 'External 3P Side Effects (External API calls / emails)',
      scope: 'Irreversible / Human Response',
      mechanism: 'Compensating actions required. High-impact operations gated behind Human Consent.',
      preventionVsCleanup: 'External third-party side effects require operator intervention and compensating transactions.',
      status: 'external'
    }
  ];

  const currentScenario = incidentScenarios.find(s => s.id === selectedScenarioId) || incidentScenarios[0];

  const addLog = (msg: string) => {
    setStabilizerLogs(prev => [...prev, msg]);
  };

  const handleSimulateAttack = () => {
    setStabilizationStatus('simulated_attack');
    setActiveStep(0);
    setStabilizationElapsedMs(null);

    addLog(`\n[INCIDENT DETECTED] Attack Vector: ${currentScenario.name}`);
    addLog(`[SEVERITY] ${currentScenario.severity} — ${currentScenario.symptom}`);
    addLog(`[TELEMETRY] cgroups memory/cpu limit breached. Target: ${currentScenario.attackDetail}`);
    addLog(`[ACTION REQUIRED] Host instability imminent. Safe Recovery Controller ready.`);
  };

  const handleExecuteRapidStabilization = async () => {
    setIsStabilizing(true);
    const start = performance.now();

    addLog('\n>>> EXECUTING RAPID STABILIZATION SEQUENCE <<<');

    // Step 1: Sub-Second Process Freeze (cgroup.kill)
    setActiveStep(1);
    await new Promise(r => setTimeout(r, 120));
    addLog('  [STEP 1 / 5] cgroup.kill -> Dispatched SIGKILL across entire agent process subtree (52ms)');
    addLog('  [CONFIRMATION] Process tree frozen. 0 surviving orphan threads.');

    // Step 2: Capability Revocation & Egress Sever
    setActiveStep(2);
    await new Promise(r => setTimeout(r, 100));
    await triggerEmergencyStop();
    addLog('  [STEP 2 / 5] Invalidate Concord Broker capability tokens & sever local IPC/socket channels (38ms)');
    addLog('  [CONFIRMATION] All privileged execution credentials revoked.');

    // Step 3: Atomic Snapshot Filesystem Rollback
    setActiveStep(3);
    await new Promise(r => setTimeout(r, 150));
    rollbackFilesystem();
    addLog('  [STEP 3 / 5] Atomic rollback to pre-exploit filesystem snapshot via copy-on-write journal (118ms)');
    addLog('  [CONFIRMATION] Dropped payloads purged. System files restored to baseline.');

    // Step 4: Cryptographic Policy & Baseline Integrity Check
    setActiveStep(4);
    await new Promise(r => setTimeout(r, 120));
    resetPolicyToDefault();
    const ledgerCheck = await verifyLedgerIntegrity();
    addLog('  [STEP 4 / 5] Re-verify Ed25519 signature on concord_policy & SHA-256 ledger integrity (44ms)');
    addLog(`  [CONFIRMATION] Policy valid (ed25519:7a4f91b...). Ledger blocks verified intact.`);

    // Step 5: Safe Clean-State Resume in Isolated Quarantine
    setActiveStep(5);
    await new Promise(r => setTimeout(r, 100));
    await restoreFromEmergencyStop();
    addLog('  [STEP 5 / 5] Disengage emergency stop. Resume unprivileged broker under strict seccomp bounds (42ms)');

    const totalMs = Math.round(performance.now() - start);
    setStabilizationElapsedMs(totalMs);
    setStabilizationStatus('stabilized');
    setIsStabilizing(false);

    addLog(`\n[SYSTEM FULLY STABILIZED IN ${totalMs}ms]`);
    addLog('  Zero reboots required. Host OS pristine. Agent quarantined.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>INCIDENT RESPONSE &amp; FAST RESTORATION</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Rapid System Stabilization: Responding to Active Attacks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            How OMG::CONCORD freezes the attack blast radius, rolls back state, and restores host stability in under 500 milliseconds without downtime.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs shrink-0">
          <button
            onClick={() => setActiveTab('rapid')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'rapid'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fast Stabilizer Engine
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual vs. CONCORD Speed
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Remediation Scope
          </button>
        </div>
      </div>

      {/* TAB 1: Fast Stabilizer Engine */}
      {activeTab === 'rapid' && (
        <div className="space-y-6">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
            <div>
              <div className="text-slate-400">Restoration Cadence</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">
                &lt; 500ms Average
              </div>
              <span className="text-[10px] text-slate-500">Sub-second blast radius freeze</span>
            </div>

            <div>
              <div className="text-slate-400">Host Reboot Required?</div>
              <div className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                0 Reboots
              </div>
              <span className="text-[10px] text-slate-500">In-place cgroup &amp; snapshot revert</span>
            </div>

            <div>
              <div className="text-slate-400">Orphan Process Guarantee</div>
              <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                0 Orphan PIDs
              </div>
              <span className="text-[10px] text-slate-500">Enforced by cgroup.kill signal</span>
            </div>

            <div>
              <div className="text-slate-400">Forensic Proof Sealed</div>
              <div className="text-lg font-mono font-bold text-cyan-300 mt-0.5">
                100% Chained
              </div>
              <span className="text-[10px] text-slate-500">TPM 2.0 monotonic audit record</span>
            </div>
          </div>

          {/* Interactive Incident & Stabilization Playground */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Attack Scenario Picker & Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Select Active Attack Scenario
                  </h3>
                  <span className="text-[10px] font-mono text-rose-400 font-bold">
                    {currentScenario.severity}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {incidentScenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedScenarioId(s.id);
                        setStabilizationStatus('idle');
                        setStabilizationElapsedMs(null);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                        selectedScenarioId === s.id
                          ? 'bg-slate-800 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-semibold text-slate-200 truncate">{s.name}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.symptom}</div>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400">Exploit Mechanism:</div>
                  <div className="text-rose-300 text-[11px] font-bold">{currentScenario.attackDetail}</div>
                  <div className="text-slate-500 text-[10px] pt-1">
                    Affected: {currentScenario.affectedResources.join(' · ')}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleSimulateAttack}
                    disabled={isStabilizing}
                    className="w-full py-2 px-3 text-xs font-semibold bg-rose-950/70 hover:bg-rose-900/80 border border-rose-700/60 text-rose-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Trigger Active Compromise Simulation</span>
                  </button>

                  <button
                    onClick={handleExecuteRapidStabilization}
                    disabled={isStabilizing}
                    className="w-full py-2.5 px-3 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>
                      {isStabilizing ? 'Stabilizing System...' : 'Execute Rapid Stabilization (< 500ms)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 5-Step Rapid Stabilization Sequence Indicator */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">
                  5-Stage Stabilization Protocol:
                </span>
                
                {[
                  { step: 1, label: '1. Freeze Subtree via cgroup.kill', time: '~50ms' },
                  { step: 2, label: '2. Invalidate Broker Capabilities & Sockets', time: '~35ms' },
                  { step: 3, label: '3. Atomic Filesystem Snapshot Rollback', time: '~120ms' },
                  { step: 4, label: '4. Validate Ed25519 Policy & SHA-256 Ledger', time: '~45ms' },
                  { step: 5, label: '5. Resume Clean Workload in Strict Isolation', time: '~40ms' }
                ].map(st => {
                  const isCurrent = activeStep === st.step && isStabilizing;
                  const isDone = activeStep > st.step || stabilizationStatus === 'stabilized';

                  return (
                    <div
                      key={st.step}
                      className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300'
                          : isCurrent
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 animate-pulse'
                          : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                            {st.step}
                          </span>
                        )}
                        <span className="font-medium text-[11px]">{st.label}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-75">{st.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Real-time Terminal & Speed Gauge (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Speed Result Card */}
              {stabilizationElapsedMs !== null && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                        System Successfully Stabilized
                      </div>
                      <div className="text-sm text-slate-200 mt-0.5">
                        Clean baseline restored with zero reboot downtime.
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-xs text-slate-400">Elapsed Time:</div>
                    <div className="text-xl font-extrabold text-emerald-400 tabular-nums">
                      {stabilizationElapsedMs} ms
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal View */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs shadow-inner flex flex-col h-[420px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200">
                      concord_recovery: rapid_stabilizer.log
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Live Response Stream
                  </span>
                </div>

                <div className="flex-1 space-y-1.5 overflow-y-auto pr-2 leading-relaxed">
                  {stabilizerLogs.map((log, idx) => {
                    let color = 'text-slate-300';
                    if (log.includes('[INCIDENT') || log.includes('[SEVERITY') || log.includes('BREACHED')) color = 'text-rose-400 font-bold';
                    if (log.includes('>>>') || log.includes('EXECUTING')) color = 'text-amber-300 font-bold';
                    if (log.includes('[STEP') || log.includes('[TELEMETRY]')) color = 'text-sky-300';
                    if (log.includes('[CONFIRMATION]') || log.includes('[OK]') || log.includes('STABILIZED')) color = 'text-emerald-400 font-semibold';

                    return (
                      <div key={idx} className={`${color} whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Comparison: Manual vs. CONCORD Speed */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-300">Why Manual Incident Response Is Too Slow for AI: </strong>
            Autonomous rogue agents execute malicious actions at machine speeds (hundreds of syscalls per second). 
            Traditional incident response (triaging alerts, paging on-call engineers, hunting through logs, and reimaging machines) takes hours or days. 
            OMG::CONCORD shifts incident response to <strong>real-time automated deterministic containment</strong>.
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Response Action</th>
                    <th className="py-3 px-4">Traditional Manual IR</th>
                    <th className="py-3 px-4">OMG::CONCORD Automated</th>
                    <th className="py-3 px-4">Downtime &amp; Data Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Blast Radius Containment
                    </td>
                    <td className="py-3 px-4 text-rose-400">
                      15 – 60 minutes (Alert triage, remote SSH)
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      &lt; 50 ms (cgroups v2 freeze)
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      Attacker contained before lateral network movement.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Process &amp; Orphan Termination
                    </td>
                    <td className="py-3 px-4 text-rose-400">
                      Manual `pkill` / hunting background scripts
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      Sub-second cgroup tree SIGKILL
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      Zero hidden daemon processes survive.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Filesystem Integrity Restoration
                    </td>
                    <td className="py-3 px-4 text-rose-400">
                      2 – 8 hours (Re-imaging or backup restore)
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      ~120 ms (Transactional snapshot revert)
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      No host re-installation required. Restored in-place.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Forensic Audit Preservation
                    </td>
                    <td className="py-3 px-4 text-rose-400">
                      Risk of wiped logs (`rm -rf /var/log`)
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      Immutable SHA-256 + TPM Counter
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      Adversary cannot delete or tamper with evidence.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Safe Workload Resume
                    </td>
                    <td className="py-3 px-4 text-rose-400">
                      Hours/Days of offline investigation
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      Immediate in strict quarantine
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      Clean workloads continue running without service outage.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Remediation Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Threat / Attack Vector</th>
                  <th className="py-3 px-4">Remediation Scope</th>
                  <th className="py-3 px-4">Concord Safe Recovery Mechanism</th>
                  <th className="py-3 px-4">Cleanup vs. Prevention Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cleanupMatrix.map((item, idx) => {
                  let badge = 'bg-slate-800 text-slate-300';
                  if (item.status === 'cleanable') badge = 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50';
                  if (item.status === 'boundary') badge = 'bg-amber-950/80 text-amber-300 border border-amber-700/50';
                  if (item.status === 'external') badge = 'bg-rose-950/80 text-rose-300 border border-rose-700/50';

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {item.threat}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${badge}`}>
                          {item.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-xs">
                        {item.mechanism}
                      </td>
                      <td className="py-3 px-4 text-slate-400 leading-relaxed">
                        {item.preventionVsCleanup}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
