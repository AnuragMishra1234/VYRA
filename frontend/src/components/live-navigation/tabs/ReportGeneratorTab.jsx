import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { downloadReportPdf } from '../../../services/api';

export default function ReportGeneratorTab({ activeExperiment = null }) {
  const [reportTitle, setReportTitle] = useState('VYRA Major Project Demonstration Experiment Report');
  const [scenarioName, setScenarioName] = useState(
    activeExperiment?.scenario || 'GNSS Outage Stress Test (10s Injection)'
  );
  const [outageDuration, setOutageDuration] = useState(
    activeExperiment?.outageDuration !== undefined ? activeExperiment.outageDuration : 10.0
  );
  const [operatorNotes, setOperatorNotes] = useState(
    'Evaluated live during university major project technical review. Outage successfully mitigated by proactive switching to HYBRID and DR modes.'
  );
  const [experimentId, setExperimentId] = useState(
    activeExperiment?.id || `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setDownloadSuccess(false);
    try {
      await downloadReportPdf({
        experiment_id: experimentId,
        title: reportTitle,
        scenario: scenarioName,
        outage_duration_s: parseFloat(outageDuration),
        notes: operatorNotes,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Card */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">
              <FileText className="w-3.5 h-3.5" />
              <span>Publication Documentation Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Automatic Experiment Report Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Compile evaluated simulation runs and algorithm benchmarks into an authentic, downloadable PDF
              document complete with telemetry parameters, statistical tables, and experiment notes.
            </p>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs tracking-wider uppercase shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Compiling PDF with ReportLab...' : 'GENERATE EXPERIMENT REPORT (PDF)'}</span>
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Report generated and download initiated successfully!</span>
          </div>
        )}
      </div>

      {/* 2. Two-Column Configuration & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metadata & Report Configuration Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl font-mono text-xs">
          <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Report Metadata & Parameters</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 block">Experiment ID:</label>
              <input
                type="text"
                value={experimentId}
                onChange={(e) => setExperimentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block">Report Document Title:</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block">Tested Scenario Description:</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block">Injected Outage Duration (s):</label>
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                value={outageDuration}
                onChange={(e) => setOutageDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block">Operator & Experiment Notes:</label>
              <textarea
                rows={4}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Add examiner observations or testing comments..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none font-sans text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Document Sheet Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6 font-sans text-xs leading-relaxed border border-slate-300">
          {/* Document Header Preview */}
          <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-start">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-blue-600 font-bold">
                VYRA NAVIGATION RESEARCH PLATFORM
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-950 mt-1">
                {reportTitle}
              </h1>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Experiment ID: <b>{experimentId}</b> | Generated:{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-center hidden sm:block">
              <div className="text-[9px] font-mono font-bold text-blue-700">VERIFIED TEST</div>
              <div className="text-xs font-mono font-bold text-slate-800">IO-VNBD V-S3a</div>
            </div>
          </div>

          {/* 1. Experiment Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              1. System Setup & Benchmark Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[11px] font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Dataset Partition:</span> IO-VNBD Test (V-S3a)
              </div>
              <div>
                <span className="text-slate-500">Sampling Rate:</span> 10.0 Hz (dt = 0.1s)
              </div>
              <div>
                <span className="text-slate-500">Tested Scenario:</span> {scenarioName}
              </div>
              <div>
                <span className="text-slate-500">Injected Outage:</span> {outageDuration}s
              </div>
              <div>
                <span className="text-slate-500">Forecasting Model:</span> XGBoost (H=3s)
              </div>
              <div>
                <span className="text-slate-500">Anti-Chattering:</span> tau_dwell = 2.0s
              </div>
            </div>
          </div>

          {/* 2. Multi-Policy Comparison Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Synchronous Policy Benchmark Results
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2 border border-slate-300">Policy</th>
                    <th className="p-2 text-right border border-slate-300">ATE (m)</th>
                    <th className="p-2 text-right border border-slate-300">RMSE (m)</th>
                    <th className="p-2 text-right border border-slate-300">Max Error</th>
                    <th className="p-2 text-right border border-slate-300">Time &gt; 5m</th>
                    <th className="p-2 text-right border border-slate-300">Handovers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border border-slate-300 font-sans">GNSS-Only</td>
                    <td className="p-2 text-right border border-slate-300">17.136</td>
                    <td className="p-2 text-right border border-slate-300">67.355</td>
                    <td className="p-2 text-right border border-slate-300">520.61m</td>
                    <td className="p-2 text-right border border-slate-300">278.8s</td>
                    <td className="p-2 text-right border border-slate-300">0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-sans">Pure DR</td>
                    <td className="p-2 text-right border border-slate-300">720.202</td>
                    <td className="p-2 text-right border border-slate-300">864.252</td>
                    <td className="p-2 text-right border border-slate-300">1610.99m</td>
                    <td className="p-2 text-right border border-slate-300">2422.5s</td>
                    <td className="p-2 text-right border border-slate-300">0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-sans">Fixed HYBRID</td>
                    <td className="p-2 text-right border border-slate-300">0.426</td>
                    <td className="p-2 text-right border border-slate-300">1.453</td>
                    <td className="p-2 text-right border border-slate-300">12.96m</td>
                    <td className="p-2 text-right border border-slate-300">57.8s</td>
                    <td className="p-2 text-right border border-slate-300">0</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-sans">Reactive Switching</td>
                    <td className="p-2 text-right border border-slate-300">0.712</td>
                    <td className="p-2 text-right border border-slate-300">2.497</td>
                    <td className="p-2 text-right border border-slate-300">21.26m</td>
                    <td className="p-2 text-right border border-slate-300">118.3s</td>
                    <td className="p-2 text-right border border-slate-300">42</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-2 border border-slate-300 font-sans text-blue-900">
                      VYRA Adaptive (Proposed)
                    </td>
                    <td className="p-2 text-right border border-slate-300 text-blue-700">0.399</td>
                    <td className="p-2 text-right border border-slate-300">1.396</td>
                    <td className="p-2 text-right border border-slate-300">12.74m</td>
                    <td className="p-2 text-right border border-slate-300">57.4s</td>
                    <td className="p-2 text-right border border-slate-300">67</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Scientific Findings & Operator Notes */}
          <div className="space-y-3 pt-2">
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                3. Scientific Observations & Verification
              </h4>
              <p className="text-[11px] text-slate-700 mt-2">
                VYRA achieves a <b>44.0% reduction in ATE</b> compared to Reactive Switching (0.399m vs 0.712m)
                and reduces critical safety boundary violations (&gt;5m) by <b>51.5%</b>. Proactive action-conditioned
                error estimation effectively prevents filter contamination during severe GNSS degradations.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                4. Examiner & Operator Notes
              </h4>
              <p className="text-[11px] text-slate-700 mt-1 italic font-sans">{operatorNotes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
