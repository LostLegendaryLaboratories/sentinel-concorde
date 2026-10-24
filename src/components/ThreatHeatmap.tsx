import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useConcord } from '../context/ConcordContext';
import { Shield, AlertCircle, RefreshCw, Layers, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export interface HeatmapCell {
  nodeId: string;
  nodeName: string;
  runtime: string;
  threatVector: string;
  threatLevel: number; // 0: Nominal, 1: Low/Monitored, 2: High/Blocked, 3: Critical/Quarantined
  status: 'Nominal' | 'Monitored' | 'Blocked' | 'Quarantined';
  lastEvent: string;
  activeProfile: string;
}

export const ThreatHeatmap: React.FC = () => {
  const { systemMetrics } = useConcord();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const threatVectors = useMemo(() => [
    'Privilege Escalation',
    'Prompt Injection',
    'Recursive Fork Bomb',
    'Filesystem Tamper',
    'Network Exfil',
    'Harm Invariant'
  ], []);

  const initialNodes = useMemo(() => [
    { id: 'node_01', name: 'ARIEL-01', runtime: 'Local P920 Workstation' },
    { id: 'node_02', name: 'HF-Llama-70B', runtime: 'Campus GPU Lab A' },
    { id: 'node_03', name: 'Claude-3.5-CU', runtime: 'Worker Node 03' },
    { id: 'node_04', name: 'AutoGPT-Loop', runtime: 'Scraper Cluster 01' },
    { id: 'node_05', name: 'DeepSeek-R1', runtime: 'Research Cluster B' },
    { id: 'node_06', name: 'Ollama-Mistral', runtime: 'Edge Gateway 02' }
  ], []);

  // Generate initial grid data
  const generateInitialData = (): HeatmapCell[] => {
    const data: HeatmapCell[] = [];
    initialNodes.forEach(node => {
      threatVectors.forEach(tv => {
        let threatLevel = 0;
        let status: HeatmapCell['status'] = 'Nominal';
        let lastEvent = 'All syscalls within whitelisted profile';

        // Pre-seed a few realistic containment events
        if (node.name === 'HF-Llama-70B' && tv === 'Prompt Injection') {
          threatLevel = 2;
          status = 'Blocked';
          lastEvent = 'Static AST gate blocked command separator `; /bin/bash`';
        } else if (node.name === 'AutoGPT-Loop' && tv === 'Recursive Fork Bomb') {
          threatLevel = 2;
          status = 'Blocked';
          lastEvent = 'cgroups v2 pids.max capped surplus sub-agents at depth 2';
        } else if (node.name === 'Claude-3.5-CU' && tv === 'Privilege Escalation') {
          threatLevel = 1;
          status = 'Monitored';
          lastEvent = 'Read attempt on protected path intercepted; unprivileged';
        } else if (node.name === 'DeepSeek-R1' && tv === 'Network Exfil') {
          threatLevel = 2;
          status = 'Blocked';
          lastEvent = 'Transport layer dropped raw DNS socket attempt';
        }

        data.push({
          nodeId: node.id,
          nodeName: node.name,
          runtime: node.runtime,
          threatVector: tv,
          threatLevel,
          status,
          lastEvent,
          activeProfile: 'libseccomp::strict_least_privilege'
        });
      });
    });
    return data;
  };

  const [gridData, setGridData] = useState<HeatmapCell[]>(generateInitialData);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  // If system emergency stop is engaged, set all nodes to quarantined
  useEffect(() => {
    if (systemMetrics.emergencyStopEngaged) {
      setGridData(prev => prev.map(c => ({
        ...c,
        threatLevel: 3,
        status: 'Quarantined',
        lastEvent: 'System emergency lockdown engaged (concord_controller --kill-all)'
      })));
    }
  }, [systemMetrics.emergencyStopEngaged]);

  // Simulate real-time telemetry pulse / randomization
  const handleRandomizeTelemetry = () => {
    setGridData(prev => prev.map(cell => {
      // 70% chance to remain nominal/contained, 30% chance to trigger a monitored or blocked event
      const rand = Math.random();
      let threatLevel = 0;
      let status: HeatmapCell['status'] = 'Nominal';
      let lastEvent = 'Normal execution within cgroup bounds';

      if (rand > 0.85) {
        threatLevel = 2;
        status = 'Blocked';
        lastEvent = `Seccomp BPF filter blocked out-of-policy syscall on ${cell.threatVector}`;
      } else if (rand > 0.70) {
        threatLevel = 1;
        status = 'Monitored';
        lastEvent = `Task bounded-autonomy quota reached 80% ceiling`;
      }

      return {
        ...cell,
        threatLevel,
        status,
        lastEvent
      };
    }));
  };

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 700;
    const margin = { top: 40, right: 25, bottom: 65, left: 140 };
    const width = Math.max(containerWidth - margin.left - margin.right, 420);
    const height = 260 - margin.top - margin.bottom;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('width', '100%')
      .attr('height', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Threat Vectors
    const xScale = d3.scaleBand()
      .domain(threatVectors)
      .range([0, width])
      .padding(0.08);

    // Y Scale: Agent Nodes
    const nodeNames = initialNodes.map(n => n.name);
    const yScale = d3.scaleBand()
      .domain(nodeNames)
      .range([0, height])
      .padding(0.1);

    // Color mapping for threat levels
    const colorMap = (threatLevel: number) => {
      switch (threatLevel) {
        case 0:
          return '#064e3b'; // Emerald-900 (Nominal / Contained)
        case 1:
          return '#b45309'; // Amber-700 (Monitored / Warning)
        case 2:
          return '#be123c'; // Rose-700 (Active Threat Intercepted / Blocked)
        case 3:
          return '#7c3aed'; // Purple-600 (Quarantined / Emergency Stop)
        default:
          return '#0f172a';
      }
    };

    // Render X Axis (Threat Vectors)
    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0));

    xAxis.select('.domain').remove();
    xAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('transform', 'rotate(-18)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.6em');

    // Render Y Axis (Agent Nodes)
    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0));

    yAxis.select('.domain').remove();
    yAxis.selectAll('text')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Tooltip div
    const tooltip = d3.select(containerRef.current)
      .select<HTMLDivElement>('.d3-heatmap-tooltip');

    // Draw Heatmap Cells
    const cells = g.selectAll('.heatmap-cell')
      .data(gridData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.threatVector) || 0)
      .attr('y', d => yScale(d.nodeName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => colorMap(d.threatLevel))
      .attr('stroke', d => (selectedCell?.nodeName === d.nodeName && selectedCell?.threatVector === d.threatVector ? '#38bdf8' : '#1e293b'))
      .attr('stroke-width', d => (selectedCell?.nodeName === d.nodeName && selectedCell?.threatVector === d.threatVector ? 2 : 1))
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.3s ease, stroke 0.2s ease');

    // Cell interactions
    cells
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2);

        tooltip
          .style('opacity', '1')
          .html(`
            <div class="font-bold text-slate-100">${d.nodeName}</div>
            <div class="text-[10px] text-amber-400 font-mono">${d.threatVector}</div>
            <div class="text-[11px] mt-1 font-semibold ${
              d.threatLevel === 0 ? 'text-emerald-400' : d.threatLevel === 1 ? 'text-amber-400' : 'text-rose-400'
            }">Status: ${d.status}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">${d.lastEvent}</div>
          `);
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, containerRef.current);
        tooltip
          .style('left', `${x + 15}px`)
          .style('top', `${y - 20}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', d => (selectedCell?.nodeName === (d as HeatmapCell).nodeName && selectedCell?.threatVector === (d as HeatmapCell).threatVector ? '#38bdf8' : '#1e293b'))
          .attr('stroke-width', d => (selectedCell?.nodeName === (d as HeatmapCell).nodeName && selectedCell?.threatVector === (d as HeatmapCell).threatVector ? 2 : 1));

        tooltip.style('opacity', '0');
      })
      .on('click', function(event, d) {
        setSelectedCell(d);
      });

  }, [gridData, threatVectors, initialNodes, selectedCell]);

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">
              Real-Time Node Threat Containment Heatmap (D3.js)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live telemetry matrix tracking containment status across autonomous agent runtimes (Hugging Face, Anthropic, Local P920).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRandomizeTelemetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Simulate random threat probes across agent nodes to trigger live D3 color updates"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate Probe Surge</span>
          </button>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* D3 Heatmap Canvas (8 cols) */}
        <div ref={containerRef} className="lg:col-span-8 relative bg-slate-950/80 rounded-lg border border-slate-800/80 p-2 overflow-x-auto">
          <svg ref={svgRef} className="w-full min-w-[500px] h-[270px]" />

          {/* Floating Tooltip */}
          <div 
            className="d3-heatmap-tooltip pointer-events-none absolute z-20 px-2.5 py-1.5 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs max-w-xs transition-opacity duration-150 opacity-0"
            style={{ left: 0, top: 0 }}
          />

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-slate-850 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#064e3b] border border-emerald-700/60" />
              <span>Contained (Nominal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#b45309] border border-amber-600/60" />
              <span>Monitored (Threshold)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#be123c] border border-rose-600/60" />
              <span>Threat Blocked (Seccomp)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#7c3aed] border border-purple-600/60" />
              <span>Quarantined</span>
            </div>
          </div>
        </div>

        {/* Selected Cell Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-lg border border-slate-800/80 p-3.5 space-y-3 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">NODE INSPECTOR</span>
              {selectedCell ? (
                <span className={`px-2 py-0.5 rounded font-bold ${
                  selectedCell.threatLevel === 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : selectedCell.threatLevel === 1
                    ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                }`}>
                  {selectedCell.status.toUpperCase()}
                </span>
              ) : (
                <span className="text-slate-500">SELECT A CELL</span>
              )}
            </div>

            {selectedCell ? (
              <div className="space-y-2 mt-3 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">AGENT NODE:</span>
                  <span className="font-bold text-slate-200">{selectedCell.nodeName}</span>
                  <span className="text-[10px] text-slate-400 block">{selectedCell.runtime}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">THREAT VECTOR:</span>
                  <span className="text-amber-400 font-semibold">{selectedCell.threatVector}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">ACTIVE OS CONFINEMENT:</span>
                  <span className="text-sky-300 text-[11px]">{selectedCell.activeProfile}</span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-500 text-[10px] block">LAST TELEMETRY EVENT:</span>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5 bg-slate-900 p-2 rounded border border-slate-800 leading-relaxed">
                    {selectedCell.lastEvent}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-mono text-[11px]">
                Click any cell in the D3 heatmap to inspect real-time syscall filters and containment logs for that agent node.
              </div>
            )}
          </div>

          {selectedCell && (
            <button
              onClick={() => {
                setGridData(prev => prev.map(c => 
                  c.nodeName === selectedCell.nodeName && c.threatVector === selectedCell.threatVector
                    ? { ...c, threatLevel: 0, status: 'Nominal', lastEvent: 'Remediated: Restored to pristine snapshot' }
                    : c
                ));
                setSelectedCell(prev => prev ? { ...prev, threatLevel: 0, status: 'Nominal', lastEvent: 'Remediated: Restored to pristine snapshot' } : null);
              }}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              Reset Cell to Nominal (Contained)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
