import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Layers, 
  CheckCircle, 
  RotateCcw, 
  AlertTriangle,
  Key,
  Save
} from 'lucide-react';

export const PolicyView: React.FC = () => {
  const { policy, setPolicy, resetPolicyToDefault } = useConcord();

  const [newPath, setNewPath] = useState('');
  const [newSyscall, setNewSyscall] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAddPath = () => {
    if (!newPath.trim()) return;
    if (!policy.allowedPaths.includes(newPath.trim())) {
      setPolicy(prev => ({
        ...prev,
        allowedPaths: [...prev.allowedPaths, newPath.trim()],
        updatedAt: new Date().toISOString()
      }));
    }
    setNewPath('');
    notifySaved();
  };

  const handleRemovePath = (pathToRemove: string) => {
    setPolicy(prev => ({
      ...prev,
      allowedPaths: prev.allowedPaths.filter(p => p !== pathToRemove),
      updatedAt: new Date().toISOString()
    }));
    notifySaved();
  };

  const handleAddSyscall = () => {
    if (!newSyscall.trim()) return;
    if (!policy.allowedSyscalls.includes(newSyscall.trim())) {
      setPolicy(prev => ({
        ...prev,
        allowedSyscalls: [...prev.allowedSyscalls, newSyscall.trim()],
        updatedAt: new Date().toISOString()
      }));
    }
    setNewSyscall('');
    notifySaved();
  };

  const handleRemoveSyscall = (syscallToRemove: string) => {
    setPolicy(prev => ({
      ...prev,
      allowedSyscalls: prev.allowedSyscalls.filter(s => s !== syscallToRemove),
      updatedAt: new Date().toISOString()
    }));
    notifySaved();
  };

  const handleResourceChange = (key: keyof typeof policy.resourceLimits, value: number) => {
    setPolicy(prev => ({
      ...prev,
      resourceLimits: {
        ...prev.resourceLimits,
        [key]: value
      },
      updatedAt: new Date().toISOString()
    }));
    notifySaved();
  };

  const notifySaved = () => {
    setSaveMessage('Policy updated & re-signed with administrator Ed25519 key.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Authority Firewall &amp; Harm Policy (concord_policy)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Declarative least-privilege policy database enforced at kernel boundary via libseccomp filters and SELinux MAC.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={resetPolicyToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Strict Default</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Admin Signature & Status */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400">Policy Hash Signature: </span>
          <span className="text-amber-300 truncate">{policy.adminSignature}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold">ED25519 SIGNATURE VALID</span>
        </div>
      </div>

      {/* Grid: Limits & Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Resource Bounds (Bounded Autonomy) */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Bounded Autonomy Resource Limits
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Maximum Recursion Depth</span>
                <span className="font-mono font-bold text-amber-300">{policy.resourceLimits.maxRecursionDepth} levels</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={policy.resourceLimits.maxRecursionDepth}
                onChange={e => handleResourceChange('maxRecursionDepth', parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                Prevents infinite self-referential sub-agent loops and fork bombs.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Memory Quota (RAM)</span>
                <span className="font-mono font-bold text-amber-300">{policy.resourceLimits.maxMemoryMB} MB</span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={policy.resourceLimits.maxMemoryMB}
                onChange={e => handleResourceChange('maxMemoryMB', parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                Hard cgroup limit. Process preempted upon memory quota violation.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Maximum Concurrent Sub-Agents</span>
                <span className="font-mono font-bold text-amber-300">{policy.resourceLimits.maxSubAgents} agents</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={policy.resourceLimits.maxSubAgents}
                onChange={e => handleResourceChange('maxSubAgents', parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                Limits process tree expansion to prevent host resource starvation.
              </span>
            </div>
          </div>
        </div>

        {/* Path Whitelist & Syscalls */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Whitelisted Paths &amp; Seccomp Syscalls
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Whitelisted Filesystem Paths (Read/Write Allowed)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {policy.allowedPaths.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] rounded"
                >
                  <span>{p}</span>
                  <button
                    onClick={() => handleRemovePath(p)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="/home/user/custom_dir"
                value={newPath}
                onChange={e => setNewPath(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAddPath}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded font-semibold transition-colors cursor-pointer"
              >
                Add Path
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Whitelisted Linux Syscalls (libseccomp BPF filter)
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {policy.allowedSyscalls.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 text-sky-400 font-mono text-[10px] rounded border border-slate-800"
                >
                  <span>{s}</span>
                  <button
                    onClick={() => handleRemoveSyscall(s)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ioctl, nanosleep"
                value={newSyscall}
                onChange={e => setNewSyscall(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAddSyscall}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded font-semibold transition-colors cursor-pointer"
              >
                Add Syscall
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Non-Negotiable Human Rights & Harm Invariants */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Immutable Human Rights &amp; Harm Invariants (Non-Configurable)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-rose-400 font-semibold">
            LOCKED AGAINST AGENT OVERRIDE
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          These moral guardrails cannot be disabled, edited, or suppressed by any agent proposal or local configuration. 
          Derived from fundamental international human rights principles to prevent violence, extortion, and vigilantism.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {policy.harmInvariants.map(inv => (
            <div
              key={inv.id}
              className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-amber-400">{inv.id}</span>
                <span className="text-[10px] text-slate-500 uppercase">{inv.category}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {inv.rule}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
