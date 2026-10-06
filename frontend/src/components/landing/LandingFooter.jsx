import React from 'react';
import { Compass, BookOpen, ExternalLink, Code2, ShieldAlert } from 'lucide-react';

export default function LandingFooter({ onViewChange, onOpenResearchModal }) {
  return (
    <footer className="bg-[#04060b] border-t border-slate-800/80 py-16 text-xs text-slate-400 font-mono">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/vyra-logo.png"
                alt="VYRA Logo"
                className="h-10 w-auto object-contain filter drop-shadow"
              />
              <span className="font-bold text-white text-base tracking-tight font-mono">VYRA</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md font-sans">
              Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization.
              An open-source research initiative investigating action-conditioned localization error forecasting.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">
              Test Split: V-S3a &bull; IO-VNBD Benchmark &bull; 119/119 Verified Tests
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <div className="font-bold text-slate-200 uppercase text-[11px] mb-3">Navigation</div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onViewChange('landing')}
                  className="hover:text-cyan-400 transition"
                >
                  Overview &amp; Concept
                </button>
              </li>
              <li>
                <button
                  onClick={() => onViewChange('prototype')}
                  className="hover:text-cyan-400 transition"
                >
                  Live Interactive Prototype
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenResearchModal}
                  className="hover:text-cyan-400 transition"
                >
                  Publication Evidence &amp; Tables
                </button>
              </li>
            </ul>
          </div>

          {/* Citation & Scientific Details */}
          <div className="space-y-2">
            <div className="font-bold text-slate-200 uppercase text-[11px] mb-3">Citation</div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono">
              IEEE Transactions on Intelligent Vehicles (Submitted 2026)
            </div>
            <div className="text-[10px] text-slate-500">
              MIT Open Source License
            </div>
          </div>
        </div>

        {/* Scientific Disclosure Notice */}
        <div className="pt-8 border-t border-slate-900 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Ground truth is labeled strictly as <strong>OFFLINE REFERENCE</strong>. Sensor degradation is software-simulated.
            </span>
          </div>
          <div>&copy; 2026 VYRA Research Team. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
