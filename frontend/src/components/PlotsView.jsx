import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { LineChart, BarChart2 } from 'lucide-react';

export default function PlotsView({ history = [] }) {
  const plotContainerRef = useRef(null);

  useEffect(() => {
    if (!plotContainerRef.current) return;

    if (history.length === 0) {
      // Empty placeholder plot
      Plotly.react(
        plotContainerRef.current,
        [],
        {
          paper_bgcolor: '#0f172a',
          plot_bgcolor: '#0b0f19',
          margin: { t: 25, r: 25, b: 35, l: 45 },
          xaxis: { title: { text: 'Time (s)', font: { color: '#94a3b8', size: 10 } }, color: '#64748b' },
          yaxis: { title: { text: 'Horizontal Error (m)', font: { color: '#94a3b8', size: 10 } }, color: '#64748b' },
        },
        { responsive: true, displayModeBar: false }
      );
      return;
    }

    // Extract series from history (up to last 150 points for snappy rendering)
    const recent = history.slice(-150);
    const times = recent.map((d) => d.relative_time_s);
    const errors = recent.map((d) => d.current_error_m);
    const bounds = recent.map(() => 5.0);

    const traces = [
      {
        x: times,
        y: errors,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'VYRA Error (m)',
        line: { color: '#38bdf8', width: 2.5 },
        marker: { size: 4, color: '#38bdf8' },
      },
      {
        x: times,
        y: bounds,
        type: 'scatter',
        mode: 'lines',
        name: '5.0m Safety Bound',
        line: { color: '#ef4444', width: 2, dash: 'dash' },
      },
    ];

    const layout = {
      paper_bgcolor: '#0f172a',
      plot_bgcolor: '#0b0f19',
      margin: { t: 20, r: 25, b: 35, l: 45 },
      showlegend: true,
      legend: {
        x: 0,
        y: 1.15,
        orientation: 'h',
        font: { color: '#cbd5e1', size: 11 },
      },
      xaxis: {
        title: { text: 'Elapsed Time (s)', font: { color: '#94a3b8', size: 11 } },
        color: '#64748b',
        gridcolor: '#1e293b',
        zerolinecolor: '#1e293b',
      },
      yaxis: {
        title: { text: 'Error (m)', font: { color: '#94a3b8', size: 11 } },
        color: '#64748b',
        gridcolor: '#1e293b',
        zerolinecolor: '#1e293b',
        range: [0, Math.max(6.0, Math.max(...errors) * 1.2)],
      },
      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.react(plotContainerRef.current, traces, layout, config);
  }, [history]);

  return (
    <div className="bg-[#0b101f]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-slate-100 tracking-wide uppercase font-mono">
            Real-Time Localization Error vs. 5.0m Safety Envelope
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Rolling Window (Last 15s)
        </span>
      </div>

      <div ref={plotContainerRef} className="w-full h-[220px]" />
    </div>
  );
}
