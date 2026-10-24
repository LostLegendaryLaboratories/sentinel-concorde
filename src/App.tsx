import React from 'react';
import { ConcordProvider, useConcord } from './context/ConcordContext';
import { Navbar } from './components/Navbar';
import { HumanConsentModal } from './components/HumanConsentModal';
import { OverviewView } from './components/OverviewView';
import { TestbedView } from './components/TestbedView';
import { AdversarialSuiteView } from './components/AdversarialSuiteView';
import { LedgerView } from './components/LedgerView';
import { PolicyView } from './components/PolicyView';
import { DemoRunnerView } from './components/DemoRunnerView';
import { ReferenceDocsView } from './components/ReferenceDocsView';
import { CleanupRemediationView } from './components/CleanupRemediationView';

const AppContent: React.FC = () => {
  const { activeTab } = useConcord();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <HumanConsentModal />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'testbed' && <TestbedView />}
        {activeTab === 'adversarial' && <AdversarialSuiteView />}
        {activeTab === 'cleanup' && <CleanupRemediationView />}
        {activeTab === 'ledger' && <LedgerView />}
        {activeTab === 'policy' && <PolicyView />}
        {activeTab === 'demo' && <DemoRunnerView />}
        {activeTab === 'reference' && <ReferenceDocsView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">OMG::CONCORD</span>
            <span>·</span>
            <span>Autonomous Intelligence Containment Architecture</span>
            <span>·</span>
            <span>Local-First &amp; Self-Hosted</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>NIST AI RMF</span>
            <span>·</span>
            <span>OWASP LLM Top 10</span>
            <span>·</span>
            <span>MITRE ATLAS</span>
            <span>·</span>
            <span>libseccomp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ConcordProvider>
      <AppContent />
    </ConcordProvider>
  );
}
