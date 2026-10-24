import React from 'react';
import { useConcord } from '../context/ConcordContext';
import { Shield, ShieldAlert, Power, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    systemMetrics, 
    triggerEmergencyStop, 
    restoreFromEmergencyStop 
  } = useConcord();

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'testbed', label: 'Proposal Testbed' },
    { id: 'adversarial', label: 'Adversarial Suite' },
    { id: 'cleanup', label: 'Forensic Cleanup' },
    { id: 'ledger', label: 'Audit Ledger' },
    { id: 'policy', label: 'Policy & Harm Filter' },
    { id: 'demo', label: '5-Step Demo Script' },
    { id: 'reference', label: 'Architecture & Roadmap' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <button 
            onClick={() => setActiveTab('overview')} 
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
              OMG::CONCORD
            </span>
            <span className="text-xs text-slate-400 ml-2 font-mono">v0.1-PoC</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, clean text with hover) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
                activeTab === link.id
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Action (Emergency Stop / Status) */}
        <div className="flex items-center gap-3 shrink-0">
          {systemMetrics.emergencyStopEngaged ? (
            <button
              onClick={restoreFromEmergencyStop}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-600/50 rounded-lg hover:bg-emerald-900/60 transition-colors whitespace-nowrap cursor-pointer"
              title="Disengage emergency stop and resume normal containment monitoring"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Resume Operations</span>
            </button>
          ) : (
            <button
              onClick={triggerEmergencyStop}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/70 border border-rose-600/50 rounded-lg hover:bg-rose-900/80 transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-rose-950"
              title="Emergency Stop: Halt all agent loops, revoke capabilities, preserve memory snapshot"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span>Emergency Kill Switch</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 bg-slate-900/80 border-t border-slate-800 gap-4 text-xs font-medium text-slate-300">
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`whitespace-nowrap pb-1 cursor-pointer ${
              activeTab === link.id ? 'text-amber-400 font-bold border-b-2 border-amber-400' : 'text-slate-400'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
