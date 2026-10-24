import React from 'react';
import { useConcord } from '../context/ConcordContext';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';

export const HumanConsentModal: React.FC = () => {
  const { pendingConsentProposal, respondToConsent } = useConcord();

  if (!pendingConsentProposal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl shadow-black/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Human Consent Required
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Action flagged for high risk / privileged operation
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Requesting Agent:</span>
            <span className="font-mono font-semibold text-amber-300">
              {pendingConsentProposal.agentId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Action Type:</span>
            <span className="font-mono text-slate-200">
              {pendingConsentProposal.actionType}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Target Path / Resource:</span>
            <span className="font-mono text-slate-200 truncate max-w-[240px]">
              {pendingConsentProposal.target}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Risk Assessment:</span>
            <span className="font-mono uppercase font-bold text-rose-400">
              {pendingConsentProposal.riskLevel}
            </span>
          </div>

          {pendingConsentProposal.payload && (
            <div>
              <span className="text-slate-400 block mb-1">Proposed Payload:</span>
              <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto max-h-28 whitespace-pre-wrap">
                {pendingConsentProposal.payload}
              </pre>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          NIST & OWASP safety guideline: No autonomous intelligence may self-execute privileged or potentially destructive operations without explicit human sign-off.
        </p>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={() => respondToConsent(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/50 rounded-lg hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deny Proposal</span>
          </button>
          <button
            onClick={() => respondToConsent(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Grant Authorization</span>
          </button>
        </div>
      </div>
    </div>
  );
};
