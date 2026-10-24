import React, { useState } from 'react';
import { DEPLOYMENT_COMPARISONS } from '../lib/constants';
import { 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  ExternalLink, 
  FileText,
  Boxes,
  Cpu
} from 'lucide-react';

export const ReferenceDocsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'deployment' | 'standards' | 'roadmap' | 'charter'>('deployment');

  const standards = [
    {
      title: 'NIST AI Risk Management Framework (AI RMF 1.0 & GenAI Profile)',
      reference: 'NIST IR 8335 / NIST AI 600-1',
      mapping: 'Maps to Concord Bounded Autonomy and Accountability. Emphasizes continuous risk measurement, governing autonomous action reach, preserving human agency, and non-bypassable auditability.'
    },
    {
      title: 'OWASP Top 10 for LLM Applications & Agent Security',
      reference: 'OWASP LLM01, LLM04, LLM06, LLM08',
      mapping: 'Guards against Prompt Injection (LLM01), Model Denial of Service (LLM04), Sensitive Information Disclosure (LLM06), and Excessive Agency (LLM08) through layered OS privilege boundaries.'
    },
    {
      title: 'MITRE ATLAS (Adversarial Threat Landscape for AI Systems)',
      reference: 'ATLAS T1028, T1059, T1055, T1499',
      mapping: 'Threat matrices for prompt injection, privilege escalation, file tampering, and resource exhaustion are formally encoded in the concord_eval adversarial test harness.'
    },
    {
      title: 'Linux Kernel Isolation & libseccomp',
      reference: 'seccomp-bpf / User Namespaces / cgroups v2',
      mapping: 'Hardware and kernel-level enforcement ensures an untrusted agent runtime cannot execute unauthorized system calls (e.g. execve on unauthorized binaries) even if the agent model is jailbroken.'
    },
    {
      title: 'Trusted Platform Module (TPM 2.0)',
      reference: 'TCG TPM 2.0 Specification / Monotonic Counters',
      mapping: 'Hardware root-of-trust for cryptographic logging. Concord anchors sequential audit ledger blocks using the TPM monotonic counter and stores policy hashes in PCR registers.'
    }
  ];

  const roadmapMilestones = [
    {
      phase: 'v0.1 Prototype (Current Milestone)',
      window: 'Oct 2026 – Jan 2027',
      status: 'Active / Implemented',
      deliverables: [
        'Declarative concord_policy engine schema & admin Ed25519 signatures',
        'Bounded-autonomy controller (task quotas, recursion limit, OOM prevention)',
        'Concord Broker unprivileged execution in Linux user namespaces',
        'Cryptographic audit ledger with SHA-256 block chaining & TPM monotonic counter',
        'Automated concord_eval suite with 10 adversarial red-team test scenarios',
        'Reference demo script and interactive testbed'
      ]
    },
    {
      phase: 'v1.0 Full Release (Production Hardening)',
      window: 'Feb 2027 – Jun 2027',
      status: 'Planned',
      deliverables: [
        'Hardened Rust core daemon with direct libseccomp-sys and SELinux bindings',
        'gVisor / Firecracker microVM backend for multi-tenant hypervisor isolation',
        'Hardware TPM 2.0 PCR attestation and Cosign signature verification',
        'Distributed append-only witness logs for cross-organization auditing',
        'Native .deb and .rpm packaging with systemd integration and AppArmor profiles',
        'Community red-team challenge and third-party security audit'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Architecture Reference, Deployment Matrix &amp; Roadmap
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive evaluation of containment packaging strategies, authoritative AI safety standards, and project timeline.
          </p>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveSection('deployment')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'deployment'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deployment Packaging
          </button>
          <button
            onClick={() => setActiveSection('standards')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'standards'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standards &amp; Citations
          </button>
          <button
            onClick={() => setActiveSection('charter')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'charter'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            White-Hat Charter &amp; Ethics
          </button>
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              activeSection === 'roadmap'
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Milestone Roadmap
          </button>
        </div>
      </div>

      {/* SECTION 1: Deployment & Packaging */}
      {activeSection === 'deployment' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-amber-300">Packaging Strategy Recommendation: </span>
            For v0.1 prototype deployment on local developer workstations (e.g. Lenovo P920), 
            a <strong className="text-white">standalone statically linked binary</strong> plus minimal Python harness provides the lowest attack surface with zero Docker daemon vulnerabilities. 
            For enterprise fleet rollout (v1.0), <strong className="text-white">OS package manager (.deb/.rpm)</strong> combined with signed AppArmor/SELinux profiles provides automatic systemd lifecycle management.
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Packaging Method</th>
                    <th className="py-3 px-4">Technology Stack</th>
                    <th className="py-3 px-4">Advantages (Pros)</th>
                    <th className="py-3 px-4">Limitations (Cons)</th>
                    <th className="py-3 px-4">Security Hardening</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DEPLOYMENT_COMPARISONS.map((dep, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 whitespace-nowrap">
                        {dep.method}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyan-300">
                        {dep.tech}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {dep.pros}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {dep.cons}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {dep.security}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Standards & Citations */}
      {activeSection === 'standards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standards.map((s, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-400">{s.reference}</span>
                <span className="text-[10px] text-slate-500">AUTHORITATIVE STANDARD</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {s.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {s.mapping}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: White-Hat Charter & Public Good */}
      {activeSection === 'charter' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                White-Hat Constitution &amp; Public Good Charter
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              OMG::CONCORD is built strictly as a <strong>defensive public good</strong>. 
              Its mission is to protect human beings and community systems from autonomous runaway behavior, rogue exploitation, and arbitrary computational overreach. 
              It adheres to the ethical white-hat consensus: safety through deterministic boundaries, transparency, and human-centered agency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-amber-400">
                01. STRICTLY DEFENSIVE (ZERO OFFENSIVE PAYLOADS)
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Defense-in-Depth, Not Cyber Warfare
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                CONCORD contains zero offensive exploit scripts, lateral movement scanners, or attack payloads. 
                Every module (firewall, controller, broker, ledger) is engineered to prevent harm, contain blast radiuses, and protect local infrastructure.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-rose-400">
                02. ANTI-VIGILANTISM &amp; NON-RETALIATION
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                No Autonomous "Justice" or Retaliation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The embedded Harm Invariants strictly forbid using CONCORD to enact unilateral retaliation, automated punishment, or extrajudicial counter-attacks. 
                When an exploit is detected, the response is containment and safe isolation—never violent or disruptive retaliation.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-cyan-400">
                03. COMMUNITY &amp; LOCAL-FIRST ACCESSIBILITY
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Accessible to Non-Profits, Schools &amp; Developers
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Safety must not be an elite corporate privilege. CONCORD is self-hosted, lightweight, and runs on standard local Linux workstations (e.g. Lenovo P920). 
                Schools, community centers, researchers, and small teams can achieve enterprise-grade containment without cloud fees.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400">
                04. OPEN REPRODUCIBILITY &amp; CIVIL LIBERTIES
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Auditability Without Surveillance
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                CONCORD operates without clandestine phone-home telemetry. All audit logs are sealed locally with SHA-256 and TPM 2.0 counters. 
                The system empowers democratic oversight, allowing independent security researchers to audit the code under open-source licenses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Roadmap & Milestones */}
      {activeSection === 'roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmapMilestones.map((milestone, idx) => (
              <div
                key={idx}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {milestone.phase}
                    </h3>
                    <div className="text-xs text-amber-400 font-mono mt-0.5">
                      {milestone.window}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                    milestone.status === 'Active / Implemented'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {milestone.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Deliverables &amp; Invariants:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {milestone.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0 mt-0.5">&bull;</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline visualization */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
            <div className="flex justify-between pb-2 mb-2 border-b border-slate-800 text-slate-200 font-bold">
              <span>Timeline Horizon</span>
              <span>2026 Q4 &rarr; 2027 Q2</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span>[2026-10-31] Requirements &amp; Policy Schema Finalized</span>
                <span className="text-emerald-400">COMPLETE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>[2026-11-14] Core Controller &amp; Broker Reference Implementation</span>
                <span className="text-emerald-400">COMPLETE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>[2026-12-12] Adversarial Evaluation Suite (10 Red-Team Invariants)</span>
                <span className="text-emerald-400">COMPLETE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>[2027-01-02] v0.1 Release Demo &amp; Audit Reproducibility Package</span>
                <span className="text-amber-400">IN PROGRESS</span>
              </div>
              <div className="flex items-center justify-between">
                <span>[2027-04-12] v1.0 Rust Daemon &amp; Hypervisor MicroVM Sandboxing</span>
                <span className="text-slate-600">SCHEDULED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
