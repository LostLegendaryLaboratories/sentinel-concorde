import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { DEMO_SCRIPT_STEPS } from '../lib/constants';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FastForward,
  ChevronRight
} from 'lucide-react';

export const DemoRunnerView: React.FC = () => {
  const { 
    submitProposal, 
    triggerEmergencyStop, 
    restoreFromEmergencyStop,
    systemMetrics 
  } = useConcord();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '# OMG::CONCORD Minimal Reference Demo Script v0.1',
    '# Target System: Linux Workstation (P920)',
    '# Ready. Click "Execute Next Step" to step through containment demonstration.'
  ]);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const executeStep = async (stepIdx: number) => {
    const step = DEMO_SCRIPT_STEPS[stepIdx];
    if (!step) return;

    addLog(`\n$ ${step.command}`);
    addLog(`[CONCORD] -> ${step.title}`);

    if (step.step === 1) {
      await restoreFromEmergencyStop();
      addLog(`[OK] concord_controller running (pid 4182)`);
      addLog(`[OK] concord_broker initialized with user namespaces & seccomp profile`);
      addLog(`[OK] Policy signature verified: ed25519:7a4f91b8...`);
    } else if (step.step === 2 && step.proposal) {
      const res = await submitProposal(step.proposal);
      addLog(`[FIREWALL ALERT] Access to ${step.proposal.target} prohibited by policy!`);
      addLog(`[OUTPUT] ${res.outputMessage}`);
      addLog(`[LEDGER] Logged DENIED event in block hash chain.`);
    } else if (step.step === 3 && step.proposal) {
      const res = await submitProposal(step.proposal);
      addLog(`[VERIFICATION GATE] Static AST scan intercepted forbidden binary execution (/bin/bash)`);
      addLog(`[OUTPUT] ${res.outputMessage}`);
      addLog(`[SECURITY] /tmp/hack was NOT created. File integrity preserved.`);
    } else if (step.step === 4 && step.proposal) {
      const res = await submitProposal(step.proposal);
      addLog(`[BROKER] Authorized benign read within sandbox (/home/user/data/info.txt)`);
      addLog(`[DATA STREAM] "${res.simulatedOutput}"`);
      addLog(`[LEDGER] Operation audited and sealed.`);
    } else if (step.step === 5) {
      await triggerEmergencyStop();
      addLog(`[EMERGENCY] concord_controller --kill-all received.`);
      addLog(`[KILL-SWITCH] Sent SIGKILL to agent process tree.`);
      addLog(`[SNAPSHOT] Isolated memory state and sealed forensic audit entry.`);
      addLog(`[STATUS] All agent loops dead. Zero orphan processes remain.`);
    }

    setCurrentStepIndex(stepIdx + 1);
  };

  const handleNextStep = async () => {
    if (currentStepIndex < DEMO_SCRIPT_STEPS.length) {
      await executeStep(currentStepIndex);
    }
  };

  const handleRunAll = async () => {
    setIsPlayingAll(true);
    for (let i = currentStepIndex; i < DEMO_SCRIPT_STEPS.length; i++) {
      await executeStep(i);
      await new Promise(r => setTimeout(r, 600));
    }
    setIsPlayingAll(false);
  };

  const handleReset = async () => {
    setCurrentStepIndex(0);
    await restoreFromEmergencyStop();
    setTerminalLogs([
      '# Terminal state reset.',
      '# Ready for fresh demo walkthrough.'
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Interactive 5-Step Demo Script Walkthrough
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step verification demonstrating containment of forbidden reads, shell spawns, benign operations, and emergency stop.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={isPlayingAll || currentStepIndex >= DEMO_SCRIPT_STEPS.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Play All Steps</span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={isPlayingAll || currentStepIndex >= DEMO_SCRIPT_STEPS.length}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {currentStepIndex >= DEMO_SCRIPT_STEPS.length
                ? 'Demo Completed'
                : `Run Step ${currentStepIndex + 1}`}
            </span>
          </button>
        </div>
      </div>

      {/* Script Step Progress Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {DEMO_SCRIPT_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          let cardStyle = 'border-slate-800 bg-slate-900/40 text-slate-400';
          if (isDone) {
            cardStyle = 'border-emerald-600/50 bg-emerald-950/20 text-emerald-300';
          } else if (isCurrent) {
            cardStyle = 'border-amber-400/80 bg-amber-950/20 text-amber-300 shadow-sm';
          }

          return (
            <div
              key={step.step}
              className={`p-3 rounded-xl border transition-all ${cardStyle}`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold">STEP 0{step.step}</span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>
              <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                {step.title}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                {step.command}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal View */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">
              user@p920-workstation:~/omg_concord
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Interactive Linux Session Emulator
          </span>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto leading-relaxed pr-2">
          {terminalLogs.map((log, idx) => {
            const isCommand = log.startsWith('$ ');
            const isError = log.includes('ALERT') || log.includes('DENIED') || log.includes('EMERGENCY');
            const isSuccess = log.includes('[OK]') || log.includes('[BROKER]') || log.includes('Authorized');

            let textColor = 'text-slate-300';
            if (isCommand) textColor = 'text-amber-300 font-bold';
            if (isError) textColor = 'text-rose-400 font-semibold';
            if (isSuccess) textColor = 'text-emerald-300';

            return (
              <div key={idx} className={`${textColor} whitespace-pre-wrap`}>
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
