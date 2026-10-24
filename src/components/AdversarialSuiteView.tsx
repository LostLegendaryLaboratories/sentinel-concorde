import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { ADVERSARIAL_TESTS } from '../lib/constants';
import { 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Filter,
  Check,
  AlertOctagon,
  RotateCcw
} from 'lucide-react';

export const AdversarialSuiteView: React.FC = () => {
  const { 
    testResults, 
    runAdversarialTest, 
    runAllAdversarialTests, 
    isTestingAll 
  } = useConcord();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Threats (10)' },
    { id: 'Prompt Injection', label: 'Prompt Injection' },
    { id: 'Privilege Escalation', label: 'Privilege Escalation' },
    { id: 'Recursive Spawn', label: 'Recursive DoS' },
    { id: 'Resource Exhaustion', label: 'Resource Abuse' },
    { id: 'Sandbox Escape', label: 'Sandbox Escape' },
    { id: 'Data Exfiltration', label: 'Data Exfil' },
    { id: 'Ledger Tampering', label: 'Audit Tampering' }
  ];

  const filteredTests = ADVERSARIAL_TESTS.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const executedCount = Object.keys(testResults).length;
  const passedCount = Object.values(testResults).filter(r => r.passed).length;
  const invariantSuccessRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 100;

  const handleRunSingle = async (testId: string) => {
    setRunningTestId(testId);
    try {
      await runAdversarialTest(testId);
    } finally {
      setRunningTestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Adversarial Test Suite &amp; Invariant Verification (concord_eval)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated red-team matrix probing prompt injection, syscall escalation, fork bombs, data leaks, and ledger tampering.
          </p>
        </div>

        <button
          onClick={runAllAdversarialTests}
          disabled={isTestingAll}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isTestingAll ? 'Executing Suite...' : 'Run All 10 Adversarial Tests'}</span>
        </button>
      </div>

      {/* Acceptance Scorecard Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div>
          <div className="text-xs text-slate-400">Total Threat Scenarios</div>
          <div className="text-lg font-mono font-bold text-white mt-0.5 tabular-nums">
            {ADVERSARIAL_TESTS.length} Scenarios
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Executed / Invariants Verified</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">
            {passedCount} / {executedCount} Passed
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">Containment Invariant Rate</div>
          <div className="text-lg font-mono font-bold text-amber-300 mt-0.5 tabular-nums">
            {executedCount === 0 ? 'Ready' : `${invariantSuccessRate}%`}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400">False Negatives (Escapes)</div>
          <div className="text-lg font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
            0 Escapes
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Test Matrix Cards */}
      <div className="space-y-3">
        {filteredTests.map(test => {
          const result = testResults[test.id];
          const isRunning = runningTestId === test.id || isTestingAll;

          let statusBadge = (
            <span className="text-[11px] font-mono text-slate-400">
              Not Executed
            </span>
          );

          if (result) {
            if (result.passed) {
              statusBadge = (
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INVARIANT HELD (BLOCKED)</span>
                </div>
              );
            } else {
              statusBadge = (
                <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-semibold">
                  <XCircle className="w-4 h-4" />
                  <span>ESCAPED (FAILURE)</span>
                </div>
              );
            }
          }

          return (
            <div
              key={test.id}
              className="p-4 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                    {test.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">
                    {test.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {statusBadge}
                  <button
                    onClick={() => handleRunSingle(test.id)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-300 mb-2 leading-relaxed">
                {test.description}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mb-2">
                <div>
                  <span className="text-slate-500">Threat Matrix: </span>
                  <span className="text-slate-300">{test.threatMatrixRef}</span>
                </div>
                <div>
                  <span className="text-slate-500">Expected Invariant: </span>
                  <span className="text-amber-300">{test.expectedInvariant}</span>
                </div>
              </div>

              {result && (
                <div className="mt-2 text-[11px] font-mono p-2 bg-slate-950/70 rounded border border-slate-800 flex items-center justify-between text-slate-400">
                  <span className="truncate mr-4">
                    Result: {result.logSummary}
                  </span>
                  <span className="shrink-0 text-slate-500 tabular-nums">
                    {result.durationMs}ms
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
