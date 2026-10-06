import React from 'react';
import LandingNavbar from './LandingNavbar';
import Hero3D from './Hero3D';
import ProblemSection from './ProblemSection';
import ThreePossibilities3D from './ThreePossibilities3D';
import HowVyraThinks from './HowVyraThinks';
import DifferentiatorSection from './DifferentiatorSection';
import ForecastVisualizer from './ForecastVisualizer';
import ArchitectureSection from './ArchitectureSection';
import ValidatedResultsSection from './ValidatedResultsSection';
import OutageDemoSection from './OutageDemoSection';
import LandingFooter from './LandingFooter';
import ResearchModal from '../ResearchModal';
import { Play, ArrowRight, Compass, ShieldCheck } from 'lucide-react';

export default function LandingPage({
  onLaunchPrototype,
  isResearchModalOpen,
  onOpenResearchModal,
  onCloseResearchModal,
}) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#060911] text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Fixed Sticky Header Navbar */}
      <LandingNavbar
        activeView="landing"
        onViewChange={(v) => {
          if (v === 'prototype') onLaunchPrototype();
        }}
        onOpenResearchModal={onOpenResearchModal}
      />

      {/* 1. Hero 3D Section */}
      <Hero3D
        onExploreClick={() => scrollToSection('problem')}
        onLaunchPrototype={onLaunchPrototype}
      />

      {/* 2. "The Problem" Section */}
      <ProblemSection />

      {/* 3. "Three Possibilities" 3D Section */}
      <ThreePossibilities3D />

      {/* 4. "How VYRA Thinks" Pipeline Section */}
      <HowVyraThinks />

      {/* 5. Core Differentiator Section */}
      <DifferentiatorSection />

      {/* 6. Forecast Visualization Section */}
      <ForecastVisualizer />

      {/* 7. System Architecture Section */}
      <ArchitectureSection />

      {/* 8. Validated Research Results Section */}
      <ValidatedResultsSection onOpenResearchModal={onOpenResearchModal} />

      {/* 9. Outage Lifecycle Demo Section */}
      <OutageDemoSection />

      {/* 10. Call to Action Section (Transition to Live Prototype) */}
      <section className="py-24 bg-gradient-to-b from-[#060911] to-[#0b101f] border-t border-slate-800 text-center relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 tracking-widest mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Verification</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono mb-6">
            Experience the Live Prototype.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Step directly into the research demonstration dashboard. Replay the 24,621 recorded epochs
            with live geodetic mapping, real-time candidate error forecasts, and authentic policy arbitration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onLaunchPrototype}
              className="px-8 py-4 rounded-xl font-bold font-mono text-sm tracking-wider uppercase bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/40 transition transform hover:-translate-y-0.5 flex items-center gap-3"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH LIVE RESEARCH PROTOTYPE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenResearchModal}
              className="px-6 py-4 rounded-xl font-semibold font-mono text-xs tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            >
              <span>INSPECT EVIDENCE TABLES</span>
            </button>
          </div>

          <div className="mt-8 text-[11px] font-mono text-slate-500">
            Connected to Phase 6 FastAPI Backend &bull; Parquet Replay Engine (10 Hz)
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter
        onViewChange={(v) => {
          if (v === 'prototype') onLaunchPrototype();
        }}
        onOpenResearchModal={onOpenResearchModal}
      />

      {/* Research Evidence Modal */}
      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={onCloseResearchModal}
      />
    </div>
  );
}
