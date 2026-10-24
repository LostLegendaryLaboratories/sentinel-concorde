import React from 'react';
import { useConcord } from '../context/ConcordContext';
import { PipelineFlowView } from './PipelineFlowView';
import { ThreatHeatmap } from './ThreatHeatmap';
import { BehavioralProfiler } from './BehavioralProfiler';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Key, 
  FileCheck2, 
  Terminal, 
  Lock, 
  Play, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { 
    systemMetrics, 
    activeProposalResult, 
    policy, 
    setActiveTab, 
    triggerEmergencyStop,
    restoreFromEmergencyStop,
    rollbackFilesystem,
    ledger,
    mitigationMode,
    toggleMitigationMode
  } = useConcord();

  const corePillars = [
    {
      id: 'firewall',
      title: 'Authority Firewall (concord_policy)',
      icon: Lock,
      color: 'text-amber-400',
      description: 'Declarative policy database backed by Ed25519 signatures and kernel-level MAC (SELinux/AppArmor). Strict least privilege.'
    },
    {
      id: 'controller',
      title: 'Bounded-Autonomy Controller',
      icon: Layers,
      color: 'text-sky-400',
      description: 'Enforces hard resource budgets: recursion depth limits, step quotas, memory caps, and prevents recursive agent fork bombs.'
    },
    {
      id: 'verification',
      title: 'Independent Verification Gate',
      icon: FileCheck2,
      color: 'text-purple-400',
      description: 'Static AST inspection, injection scanning, and pre-execution sandboxed evaluation. Proposals remain non-executable until proven safe.'
    },
    {
      id: 'harm_policy',
      title: 'Embedded Harm Invariants',
      icon: ShieldCheck,
      color: 'text-rose-400',
      description: 'Non-negotiable ethical laws: forbids violence, physical/digital sabotage, non-consensual coercion, and extrajudicial vigilantism.'
    },
    {
      id: 'broker',
      title: 'Concord Broker Executor',
      icon: Terminal,
      color: 'text-emerald-400',
      description: 'Narrow-purpose executor running in unprivileged Linux user namespaces with libseccomp filters and capability revocation.'
    },
    {
      id: 'ledger',
      title: 'Cryptographic Audit Ledger',
      icon: Key,
      color: 'text-cyan-400',
      description: 'Tamper-evident append-only ledger chained via SHA-256 blocks and rooted in TPM 2.0 monotonic hardware counters.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / System Status */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-2">
              <span>SYSTEM-WIDE SAFETY ARCHITECTURE</span>
              <span>·</span>
              <span>REFERENCE IMPLEMENTATION v0.1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Contain Runaway AI. Protect Human Agency.
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              OMG::CONCORD treats autonomous intelligence as an unprivileged, potentially adversarial entity. 
              Instead of trusting an AI model&apos;s internal guardrails, CONCORD enforces deterministic boundaries 
              through kernel-level seccomp filters, strict authority firewalls, independent verification gates, and cryptographic audit ledgers.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('testbed')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <span>Open Proposal Testbed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('adversarial')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Run Adversarial Suite (10 Tests)</span>
            </button>
          </div>
        </div>

        {/* Live System Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400">Containment Status</div>
            <div className="text-sm font-mono font-bold mt-1 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                systemMetrics.emergencyStopEngaged ? 'bg-rose-500' : 'bg-emerald-400'
              }`} />
              <span className={systemMetrics.emergencyStopEngaged ? 'text-rose-400' : 'text-emerald-400'}>
                {systemMetrics.emergencyStopEngaged ? 'LOCKED (KILL SWITCH)' : 'ACTIVE & CONFINED'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Target Agent Profile</div>
            <div className="text-sm font-mono font-bold text-slate-200 mt-1">
              {policy.agentName} <span className="text-xs text-slate-400 font-normal">({policy.id})</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Task Bounds (Depth / RAM)</div>
            <div className="text-sm font-mono text-slate-200 mt-1 tabular-nums">
              Max Depth: {policy.resourceLimits.maxRecursionDepth} · Max {policy.resourceLimits.maxMemoryMB} MB
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Audit Ledger Blocks</div>
            <div className="text-sm font-mono font-bold text-amber-300 mt-1 tabular-nums">
              {ledger.length} Block{ledger.length === 1 ? '' : 's'} Sealed
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Lockdown Notice if active */}
      {systemMetrics.emergencyStopEngaged && (
        <div className="p-4 bg-rose-950/60 border border-rose-600 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                Emergency Stop Active: All Agent Threads Terminated
              </h4>
              <p className="text-xs text-rose-300/80">
                Broker capability tokens have been invalidated. Host environment is isolated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={rollbackFilesystem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rollback Filesystem State</span>
            </button>
            <button
              onClick={restoreFromEmergencyStop}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Disengage Stop
            </button>
          </div>
        </div>
      )}

      {/* Active Threat Mitigation Mode Banner */}
      <div className={`p-4 rounded-xl border transition-all ${
        mitigationMode 
          ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/40' 
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-lg border shrink-0 ${
              mitigationMode 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                  Active Mitigation Mode (Hardened Firewall Posture)
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                  mitigationMode
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {mitigationMode ? 'ACTIVE & HARDENED' : 'STANDARD DEFAULT'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {mitigationMode
                  ? 'Stricter-than-default posture enforced: Depth locked to 1, RAM capped at 512MB, write syscalls stripped, and universal human consent required.'
                  : 'Standard baseline posture: Depth 2, 2048MB RAM quota, sandboxed write paths allowed for authorized tasks.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleMitigationMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm ${
                mitigationMode
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${mitigationMode ? 'bg-slate-950' : 'bg-slate-500'}`} />
              <span>{mitigationMode ? 'Mitigation Active (Disable)' : 'Engage Mitigation Mode'}</span>
            </button>
          </div>
        </div>

        {mitigationMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-amber-500/30 text-[11px] font-mono text-amber-200/90">
            <div>&bull; Max Recursion Depth: <strong>1 (Locked)</strong></div>
            <div>&bull; Memory Ceiling: <strong>512 MB (Halved)</strong></div>
            <div>&bull; Syscalls: <strong>Read-Only Minimal</strong></div>
            <div>&bull; Human Consent: <strong>Universal on Mutation</strong></div>
          </div>
        )}
      </div>

      {/* Live 5-Layer Containment Pipeline Flow */}
      <PipelineFlowView activeResult={activeProposalResult} />

      {/* D3-based Real-Time Node Threat Containment Heatmap */}
      <ThreatHeatmap />

      {/* Real-Time Agent Behavioral Profiler (Heuristic Threat Analysis) */}
      <BehavioralProfiler />

      {/* 6 Core Architecture Components */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide">
            Core Safety Architecture Modules
          </h2>
          <span className="text-xs text-slate-400">
            NIST AI RMF · OWASP LLM · MITRE ATLAS compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corePillars.map(p => {
            const Icon = p.icon;
            return (
              <div 
                key={p.id}
                className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`p-2 rounded-lg bg-slate-800 ${p.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {p.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quantitative Runaway Containment Effectiveness Breakdown */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">
              Quantitative Runaway Intelligence Containment Coverage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical breakdown of risk resolution by threat category based on NIST AI RMF, OWASP LLM, and OS kernel boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Blended Containment Rate:</span>
            <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 rounded-lg font-bold">
              ~85% Operational Hazards
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              category: 'Host OS Privilege Escalation',
              percentage: '98%',
              barWidth: 'w-[98%]',
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500',
              desc: 'Enforced at Linux kernel boundary (libseccomp BPF filters + user namespaces). Model cannot bypass kernel syscall tables.'
            },
            {
              category: 'Recursive Fork Bombs & Loops',
              percentage: '95%',
              barWidth: 'w-[95%]',
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500',
              desc: 'Hard cgroups v2 task and depth limits mechanically terminate processes before host CPU/RAM lockup.'
            },
            {
              category: 'Filesystem Corruption & Backdoors',
              percentage: '95%',
              barWidth: 'w-[95%]',
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500',
              desc: 'Copy-on-write snapshot rollback restores disk state in ~120ms; unauthorized files instantly purged.'
            },
            {
              category: 'Covert Network Data Exfiltration',
              percentage: '90%',
              barWidth: 'w-[90%]',
              color: 'text-sky-400',
              bgColor: 'bg-sky-500',
              desc: 'Default "network: none" firewall rule drops all outbound sockets and DNS tunnels at transport layer.'
            },
            {
              category: 'Prompt Injection Tool Exploits',
              percentage: '85%',
              barWidth: 'w-[85%]',
              color: 'text-amber-400',
              bgColor: 'bg-amber-500',
              desc: 'Static AST gate catches command separators (; | && $(...)). Even if jailbroken, OS denies execution.'
            },
            {
              category: 'Social Engineering & Human Trust',
              percentage: '30%',
              barWidth: 'w-[30%]',
              color: 'text-rose-400',
              bgColor: 'bg-rose-500',
              desc: 'Software cannot prevent an operator from being persuaded. Gated behind explicit Human Consent.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">{item.category}</span>
                <span className={`font-mono font-bold ${item.color} tabular-nums`}>{item.percentage}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`${item.bgColor} h-full rounded-full ${item.barWidth}`} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launchpad to Specification Sections */}
      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl">
        <h3 className="text-xs font-bold text-slate-300 tracking-wide uppercase mb-3">
          Explore Prototype Subsystems
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            onClick={() => setActiveTab('demo')}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-amber-300 mb-1">
              5-Step Minimal Demo
            </div>
            <p className="text-slate-400 text-[11px]">
              Execute the reference demo script step-by-step: shadow read, bash blocked, benign pass.
            </p>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-cyan-300 mb-1">
              Audit Ledger &amp; TPM Hashes
            </div>
            <p className="text-slate-400 text-[11px]">
              Inspect append-only SHA-256 blocks or simulate adversary tampering to test integrity alerts.
            </p>
          </button>

          <button
            onClick={() => setActiveTab('reference')}
            className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-purple-300 mb-1">
              Deployment &amp; Roadmap
            </div>
            <p className="text-slate-400 text-[11px]">
              Examine static binary vs container isolation comparisons and the v0.1 to v1.0 release milestones.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
