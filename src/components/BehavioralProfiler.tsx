import React, { useMemo, useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { analyzeAgentBehavior, BehavioralPattern } from '../lib/behavioralHeuristics';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Search, 
  Zap, 
  ShieldAlert, 
  Filter, 
  Layers, 
  Flame,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const BehavioralProfiler: React.FC = () => {
  const { ledger, policy, submitProposal, mitigationMode, toggleMitigationMode } = useConcord();
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute live heuristic analysis on the activity log and ledger
  const analysis = useMemo(() => {
    return analyzeAgentBehavior(ledger, policy);
  }, [ledger, policy]);

  const displayedPatterns = useMemo(() => {
    if (!filterActiveOnly) return analysis.detectedPatterns;
    return analysis.detectedPatterns.filter(p => p.detected);
  }, [analysis.detectedPatterns, filterActiveOnly]);

  // Handler to inject a multi-step sequence to test the heuristic engine live
  const handleSimulateProbeSequence = async () => {
    setIsSimulating(true);
    try {
      // Step 1: Canary probe targeting proc
      await submitProposal({
        id: `probe-canary-${Date.now()}`,
        timestamp: Date.now(),
        agentId: policy.id,
        actionType: 'read_file',
        target: '/proc/sys/kernel/core_pattern',
        riskLevel: 'high',
        requiresHumanConsent: false,
        metadata: {
          reason: 'Probing kernel core pattern handlers to check container isolation bounds'
        }
      });

      // Brief delay to simulate autonomous agent execution interval
      await new Promise(r => setTimeout(r, 120));

      // Step 2: Probing protected tokens
      await submitProposal({
        id: `probe-tokens-${Date.now()}`,
        timestamp: Date.now(),
        agentId: policy.id,
        actionType: 'read_file',
        target: '/etc/concord/tokens.json',
        riskLevel: 'high',
        requiresHumanConsent: false,
        metadata: {
          reason: 'Enumerating security tokens and cryptographic credentials'
        }
      });

      // Step 3: Staging file write
      await submitProposal({
        id: `probe-stage-${Date.now()}`,
        timestamp: Date.now(),
        agentId: policy.id,
        actionType: 'write_file',
        target: '/home/user/sandbox/stage_payload.sh',
        payload: '#!/bin/bash\ncat /proc/cpuinfo',
        riskLevel: 'medium',
        requiresHumanConsent: false,
        metadata: {
          reason: 'Writing stage payload to verify file write execution permissions'
        }
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getPostureBadge = (posture: typeof analysis.threatPosture) => {
    switch (posture) {
      case 'ANOMALOUS_ATTACK':
        return {
          label: 'ANOMALOUS ATTACK CORRELATED',
          bg: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
          dot: 'bg-rose-500 animate-pulse'
        };
      case 'SUSPICIOUS':
        return {
          label: 'SUSPICIOUS MULTI-STEP ACTIVITY',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
          dot: 'bg-amber-400 animate-ping'
        };
      case 'ELEVATED':
        return {
          label: 'ELEVATED HEURISTIC DRIFT',
          bg: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60',
          dot: 'bg-yellow-400'
        };
      case 'NOMINAL':
      default:
        return {
          label: 'NOMINAL AGENT POSTURE',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60',
          dot: 'bg-emerald-400'
        };
    }
  };

  const postureInfo = getPostureBadge(analysis.threatPosture);

  const getSeverityStyle = (severity: BehavioralPattern['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-400 border-rose-800/80 bg-rose-950/40';
      case 'high':
        return 'text-amber-400 border-amber-800/80 bg-amber-950/40';
      case 'medium':
        return 'text-yellow-400 border-yellow-800/80 bg-yellow-950/40';
      case 'low':
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  };

  return (
    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-6">
      {/* Header with Title and Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>REAL-TIME AGENT BEHAVIORAL PROFILER</span>
            <span>·</span>
            <span>HEURISTIC CORRELATION ENGINE</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Autonomous Agent Activity Profiler</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded border ${postureInfo.bg}`}>
              <span className={`w-2 h-2 rounded-full ${postureInfo.dot}`} />
              {postureInfo.label}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Correlates multi-step agent actions beyond standard single-rule firewall triggers. Analyzes velocity, 
            canary environment probing, resource ceiling escalation, fragmented payload assembly, and semantic coercion drift.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              filterActiveOnly 
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterActiveOnly ? `Flagged Only (${analysis.anomalyIndicatorsCount})` : 'All Heuristics (5)'}</span>
          </button>

          <button
            onClick={handleSimulateProbeSequence}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Injecting Probes...' : 'Simulate Reconnaissance Sequence'}</span>
          </button>
        </div>
      </div>

      {/* Anomaly Gauge & Telemetry Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-lg">
        {/* Anomaly Score Index */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Composite Anomaly Index</span>
            <span className={`font-mono font-bold tabular-nums text-sm ${
              analysis.overallAnomalyScore >= 70 ? 'text-rose-400' :
              analysis.overallAnomalyScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {analysis.overallAnomalyScore} / 100
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                analysis.overallAnomalyScore >= 70 ? 'bg-rose-500' :
                analysis.overallAnomalyScore >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${analysis.overallAnomalyScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex justify-between">
            <span>0 NOMINAL</span>
            <span>50 SUSPICIOUS</span>
            <span>100 ATTACK</span>
          </div>
        </div>

        {/* Events Analyzed */}
        <div className="border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4 space-y-0.5">
          <div className="text-xs text-slate-400">Activity Window Examined</div>
          <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
            {analysis.analyzedEventsCount} <span className="text-xs font-normal text-slate-400">Recent Blocks</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {ledger.length} total blocks in cryptographic ledger
          </div>
        </div>

        {/* Active Flags */}
        <div className="border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4 space-y-0.5">
          <div className="text-xs text-slate-400">Heuristic Signals Active</div>
          <div className="text-lg font-mono font-bold text-amber-300 tabular-nums">
            {analysis.anomalyIndicatorsCount} <span className="text-xs font-normal text-slate-400">of 5 Patterns</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {analysis.anomalyIndicatorsCount > 0 ? 'Multi-step evasion suspected' : 'All heuristics nominal'}
          </div>
        </div>

        {/* Defense Action */}
        <div className="border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400">Recommended Defense</div>
            <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">
              {analysis.threatPosture === 'NOMINAL' ? 'Maintain Baseline' : 'Tighten Hardening'}
            </div>
          </div>
          {analysis.threatPosture !== 'NOMINAL' && !mitigationMode && (
            <button
              onClick={toggleMitigationMode}
              className="mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Engage Mitigation Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
        analysis.threatPosture === 'ANOMALOUS_ATTACK'
          ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
          : analysis.threatPosture === 'SUSPICIOUS'
          ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
          : analysis.threatPosture === 'ELEVATED'
          ? 'bg-yellow-950/30 border-yellow-700/50 text-yellow-200'
          : 'bg-slate-950/50 border-slate-800 text-slate-300'
      }`}>
        <Radio className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
        <div>
          <span className="font-mono font-bold uppercase tracking-wider text-[11px] mr-2">
            Profiler Assessment:
          </span>
          <span>{analysis.recommendation}</span>
        </div>
      </div>

      {/* 5 Heuristic Pattern Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Heuristic Signature Analysis (Beyond Single-Rule Triggers)
          </span>
          <span>Showing {displayedPatterns.length} of 5 Patterns</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {displayedPatterns.map(pattern => {
            const isFlagged = pattern.detected;

            return (
              <div
                key={pattern.id}
                className={`p-4 rounded-xl border transition-all ${
                  isFlagged 
                    ? 'bg-slate-950/90 border-amber-500/60 shadow-md shadow-amber-950/20' 
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {pattern.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {pattern.name}
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getSeverityStyle(pattern.severity)}`}>
                        {pattern.severity}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Confidence Score */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">Confidence:</span>
                      <span className={`font-bold tabular-nums ${
                        pattern.confidenceScore >= 70 ? 'text-rose-400' :
                        pattern.confidenceScore >= 40 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {pattern.confidenceScore}%
                      </span>
                    </div>

                    {/* Status Indicator */}
                    <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
                      isFlagged
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/70'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {isFlagged ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>TRIGGERED</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>NOMINAL</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trigger Logic & MITRE Tag */}
                <div className="text-xs text-slate-300 space-y-1 mb-2.5">
                  <p>{pattern.triggerDescription}</p>
                  <div className="text-[11px] font-mono text-purple-400">
                    {pattern.mitreMapping}
                  </div>
                </div>

                {/* Evidence Stream */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Telemetry Correlated Evidence:
                  </div>
                  {pattern.evidence.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                      <span className="text-slate-500 shrink-0">&bull;</span>
                      <span className={isFlagged ? 'text-amber-200' : 'text-slate-400'}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
