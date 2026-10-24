import React from 'react';
import { ProposalExecutionResult } from '../types/concord';
import { 
  Bot, 
  Gauge, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Database,
  UserCheck,
  ChevronRight
} from 'lucide-react';

interface PipelineFlowViewProps {
  activeResult: ProposalExecutionResult | null;
  compact?: boolean;
}

export const PipelineFlowView: React.FC<PipelineFlowViewProps> = ({ activeResult, compact = false }) => {
  const stages = [
    {
      id: 'agent',
      label: 'AI Agent Proposal',
      sublabel: 'Untrusted Intent',
      icon: Bot,
      color: 'text-indigo-400',
      description: 'Agent generates action request or tool call'
    },
    {
      id: 'controller',
      label: 'Bounded Autonomy',
      sublabel: 'concord_controller',
      icon: Gauge,
      color: 'text-sky-400',
      description: 'Enforces hard bounds: depth, steps, memory & CPU quota'
    },
    {
      id: 'firewall',
      label: 'Authority Firewall',
      sublabel: 'concord_policy',
      icon: ShieldAlert,
      color: 'text-amber-400',
      description: 'Validates signature, path whitelists & non-negotiable Harm Invariants'
    },
    {
      id: 'verification',
      label: 'Verification Gate',
      sublabel: 'concord_eval',
      icon: CheckCircle2,
      color: 'text-purple-400',
      description: 'Static AST analysis, injection scans & payload signature checks'
    },
    {
      id: 'broker',
      label: 'Concord Broker',
      sublabel: 'OS Seccomp/SELinux',
      icon: Terminal,
      color: 'text-emerald-400',
      description: 'Unprivileged execution in Linux user namespace'
    },
    {
      id: 'ledger',
      label: 'Audit Ledger',
      sublabel: 'concord_ledger',
      icon: Database,
      color: 'text-cyan-400',
      description: 'Append-only SHA-256 chained hash with TPM monotonic counter'
    }
  ];

  const getStageStatus = (stageId: string) => {
    if (!activeResult) return 'idle';

    if (stageId === 'agent') return 'passed';

    if (stageId === 'ledger') {
      return activeResult.status === 'allowed' ? 'passed' : 'logged';
    }

    const matchedStage = activeResult.stages.find(s => s.stage === stageId);
    if (!matchedStage) {
      // If a previous stage failed, subsequent stages are unreached
      return 'unreached';
    }
    return matchedStage.passed ? 'passed' : 'failed';
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 tracking-wide">
            OMG::CONCORD 5-Layer Containment Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defense-in-depth model: every privileged action must satisfy independent verification before execution.
          </p>
        </div>
        {activeResult && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Verdict:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              activeResult.status === 'allowed'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                : activeResult.status === 'pending_consent'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
            }`}>
              {activeResult.status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {stages.map((stage, idx) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;
          const stageDetail = activeResult?.stages.find(s => s.stage === stage.id);

          let borderClass = 'border-slate-800 bg-slate-900/40';
          let indicatorIcon = null;

          if (status === 'passed') {
            borderClass = 'border-emerald-600/60 bg-emerald-950/20';
            indicatorIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          } else if (status === 'failed') {
            borderClass = 'border-rose-600/70 bg-rose-950/30';
            indicatorIcon = <XCircle className="w-4 h-4 text-rose-400" />;
          } else if (status === 'logged') {
            borderClass = 'border-amber-600/50 bg-amber-950/20';
            indicatorIcon = <Database className="w-4 h-4 text-amber-400" />;
          }

          return (
            <div
              key={stage.id}
              className={`relative rounded-lg p-3 border transition-all ${borderClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-md bg-slate-800/80 ${stage.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {indicatorIcon}
              </div>

              <div className="text-xs font-semibold text-slate-200 truncate">
                {stage.label}
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {stage.sublabel}
              </div>

              {!compact && (
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {stageDetail ? stageDetail.message : stage.description}
                </p>
              )}

              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeResult && activeResult.status === 'denied' && (
        <div className="mt-4 p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg text-xs text-rose-200 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Interception Point: </span>
            <span>
              {activeResult.rejectionStage?.toUpperCase()} — {activeResult.outputMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
