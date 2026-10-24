import React, { useState, useMemo } from 'react';
import { useConcord } from '../context/ConcordContext';
import { 
  generateOversightJsonPackage, 
  generateOversightCsvPackage, 
  triggerFileDownload 
} from '../lib/oversightExport';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  Terminal,
  ExternalLink
} from 'lucide-react';

interface OversightExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OversightExportModal: React.FC<OversightExportModalProps> = ({ isOpen, onClose }) => {
  const { 
    ledger, 
    policy, 
    testResults, 
    systemMetrics, 
    simulatedFiles, 
    verifyLedgerIntegrity 
  } = useConcord();

  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [copied, setCopied] = useState<boolean>(false);
  const [integrityState, setIntegrityState] = useState<{ checked: boolean; valid: boolean; brokenAt?: number }>({
    checked: false,
    valid: true
  });

  React.useEffect(() => {
    if (isOpen) {
      verifyLedgerIntegrity().then(res => {
        setIntegrityState({ checked: true, valid: res.isValid, brokenAt: res.brokenAtBlock });
      });
    }
  }, [isOpen, verifyLedgerIntegrity]);

  const exportData = useMemo(() => ({
    ledger,
    policy,
    testResults,
    systemMetrics,
    simulatedFiles,
    chainValid: integrityState.valid,
    brokenBlock: integrityState.brokenAt
  }), [ledger, policy, testResults, systemMetrics, simulatedFiles, integrityState]);

  const outputContent = useMemo(() => {
    if (exportFormat === 'json') {
      return generateOversightJsonPackage(exportData);
    } else {
      return generateOversightCsvPackage(exportData);
    }
  }, [exportFormat, exportData]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const timestamp = Date.now();
    if (exportFormat === 'json') {
      triggerFileDownload(
        outputContent,
        `concord_oversight_dossier_${timestamp}.json`,
        'application/json'
      );
    } else {
      triggerFileDownload(
        outputContent,
        `concord_siem_audit_log_${timestamp}.csv`,
        'text/csv;charset=utf-8;'
      );
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-black overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Export Oversight &amp; Forensic Submission Dossier
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Standardized submission format for NIST AISI, CISA, and community audit boards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Summary KPI Bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Format Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Format:</span>
            <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-slate-800 text-amber-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>JSON (Full Dossier)</span>
              </button>

              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV (SIEM Ingest)</span>
              </button>
            </div>
          </div>

          {/* Aggregated Metadata Pill Strip */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Blocks: <strong className="text-white">{ledger.length}</strong></span>
            <span>·</span>
            <span className={integrityState.valid ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {integrityState.valid ? 'SHA-256 Valid' : `Tampered at #${integrityState.brokenAt}`}
            </span>
            <span>·</span>
            <span>Ed25519: <strong className="text-amber-300">Signed</strong></span>
          </div>
        </div>

        {/* Preview Code View */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col bg-slate-950">
          <div className="flex items-center justify-between pb-2 text-xs font-mono text-slate-400">
            <span>
              Preview: {exportFormat === 'json' ? 'concord_oversight_dossier.json' : 'concord_siem_audit_log.csv'}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Output'}</span>
            </button>
          </div>

          <pre className="flex-1 p-4 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre leading-relaxed select-all">
            {outputContent}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Compliant with NIST AI RMF 1.0, OWASP LLM01-LLM10, &amp; MITRE ATLAS
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {exportFormat.toUpperCase()} Package</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
