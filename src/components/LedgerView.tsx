import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { formatHashShort } from '../lib/crypto';
import { 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Check, 
  ExternalLink,
  Search,
  KeyRound,
  FileText,
  Printer
} from 'lucide-react';
import { OversightExportModal } from './OversightExportModal';
import { generateSecurityReportJson, openPrintableSecurityReport } from '../lib/securityReportGenerator';
import { triggerFileDownload } from '../lib/oversightExport';

export const LedgerView: React.FC = () => {
  const { 
    ledger, 
    verifyLedgerIntegrity, 
    simulateLedgerTamper, 
    clearLedger,
    policy,
    testResults,
    systemMetrics,
    simulatedFiles,
    mitigationMode
  } = useConcord();

  const [verificationStatus, setVerificationStatus] = useState<{
    checked: boolean;
    valid: boolean;
    brokenAt?: number;
  }>({ checked: false, valid: true });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedgerIntegrity();
      setVerificationStatus({
        checked: true,
        valid: res.isValid,
        brokenAt: res.brokenAtBlock
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportJSON = async () => {
    const integrityCheck = await verifyLedgerIntegrity();
    
    const forensicPackage = {
      title: 'OMG::CONCORD Autonomous Agent Containment - Forensic Audit Package',
      version: '0.1-PoC',
      exportTimestamp: new Date().toISOString(),
      license: 'Public Open Source Defense Architecture (MIT / Apache 2.0 / Public Good)',
      complianceStandards: [
        'NIST AI Risk Management Framework (AI RMF 1.0 / NIST AI 600-1)',
        'OWASP Top 10 for LLM Applications (LLM01-LLM10)',
        'MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems)',
        'Linux Kernel Seccomp-BPF & User Namespaces'
      ],
      systemIntegrity: {
        totalBlocks: ledger.length,
        hashChainValid: integrityCheck.isValid,
        tpmMonotonicSequenceIntact: true,
        emergencyStopEngaged: systemMetrics.emergencyStopEngaged
      },
      activePolicy: {
        policyId: policy.id,
        agentTarget: policy.agentName,
        adminSignature: policy.adminSignature,
        signatureValid: policy.signatureValid,
        allowedPaths: policy.allowedPaths,
        allowedSyscalls: policy.allowedSyscalls,
        forbiddenActions: policy.forbiddenActions,
        harmInvariants: policy.harmInvariants
      },
      adversarialVerificationMatrix: testResults,
      auditLedgerBlocks: ledger
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(forensicPackage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `concord_public_audit_package_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadSecurityReportJson = async () => {
    const integrityCheck = await verifyLedgerIntegrity();
    const jsonStr = generateSecurityReportJson({
      ledger,
      policy,
      testResults,
      systemMetrics,
      simulatedFiles,
      chainValid: integrityCheck.isValid,
      brokenBlock: integrityCheck.brokenAtBlock,
      mitigationMode
    });
    triggerFileDownload(jsonStr, `omg_concord_security_report_${Date.now()}.json`, 'application/json');
  };

  const handleDownloadSecurityReportPdf = async () => {
    const integrityCheck = await verifyLedgerIntegrity();
    openPrintableSecurityReport({
      ledger,
      policy,
      testResults,
      systemMetrics,
      simulatedFiles,
      chainValid: integrityCheck.isValid,
      brokenBlock: integrityCheck.brokenAtBlock,
      mitigationMode
    });
  };

  const filteredBlocks = ledger.filter(b => {
    const matchesSearch = 
      b.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.blockHash.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterVerdict === 'all') return matchesSearch;
    return matchesSearch && b.verdict === filterVerdict;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Cryptographic Audit Ledger (concord_ledger)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident append-only journal. Every authorization and rejection is SHA-256 chained and anchored by TPM 2.0 monotonic counters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Hash Chain'}</span>
          </button>

          <button
            onClick={handleDownloadSecurityReportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Download compiled threat containment report and invariant verification results (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Security Report</span>
          </button>

          <button
            onClick={handleDownloadSecurityReportPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Compile printable agency-standard PDF security report with executive summary and invariant proofs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print / PDF Report</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Open structured submission package for oversight agencies (JSON / CSV)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Agency Oversight Dossier</span>
          </button>
        </div>
      </div>

      {/* Oversight Submission Modal */}
      <OversightExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />

      {/* Integrity Verification Banner */}
      {verificationStatus.checked && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
          verificationStatus.valid
            ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
            : 'bg-rose-950/50 border-rose-600/60 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {verificationStatus.valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold">
                {verificationStatus.valid
                  ? 'Cryptographic Hash Chain Verified: 100% Tamper-Evident'
                  : `SECURITY ALERT: Tampering Detected at Block #${verificationStatus.brokenAt}!`}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                {verificationStatus.valid
                  ? `All ${ledger.length} blocks adhere to SHA-256 sequential integrity. Monotonic sequence intact.`
                  : 'A historical ledger record was modified. Previous hash pointer no longer matches computed hash digest!'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setVerificationStatus({ checked: false, valid: true })}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by agent, path, or hash..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Verdict:</span>
          <select
            value={filterVerdict}
            onChange={e => setFilterVerdict(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none font-mono text-xs"
          >
            <option value="all">All Verdicts</option>
            <option value="ALLOWED">ALLOWED</option>
            <option value="DENIED">DENIED</option>
            <option value="HALTED">HALTED</option>
            <option value="EMERGENCY_STOP">EMERGENCY_STOP</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Agent / Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">TPM Counter</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4 text-right">Tamper Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredBlocks.map((block, idx) => {
                const isTampered = block.tampered;
                let verdictBadge = 'bg-slate-800 text-slate-300';
                if (block.verdict === 'ALLOWED') verdictBadge = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60';
                if (block.verdict === 'DENIED') verdictBadge = 'bg-rose-950/80 text-rose-300 border border-rose-800/60';
                if (block.verdict === 'EMERGENCY_STOP' || block.verdict === 'HALTED') verdictBadge = 'bg-amber-950/80 text-amber-300 border border-amber-800/60';

                return (
                  <tr 
                    key={block.blockNumber} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isTampered ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-200">
                      #{block.blockNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{block.agentId}</div>
                      <div className="text-[10px] text-slate-400">{block.actionType}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={block.target}>
                      {block.target}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${verdictBadge}`}>
                        {block.verdict}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 tabular-nums">
                      {block.tpmMonotonicCounter}
                    </td>

                    <td className="py-3 px-4 text-[10px] text-cyan-300/80" title={block.blockHash}>
                      {formatHashShort(block.blockHash)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => simulateLedgerTamper(block.blockNumber - 1)}
                        className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded border border-slate-700/60 transition-colors cursor-pointer"
                        title="Simulate attacker altering this block to test hash verification alert"
                      >
                        Tamper
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBlocks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    No ledger blocks matching current query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
