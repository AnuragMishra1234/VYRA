import React, { useState, useEffect } from 'react';
import { Compass, ExternalLink, Play, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function LandingNavbar({ activeView, onViewChange, onOpenResearchModal }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Overview', href: '#hero' },
    { label: 'The Problem', href: '#problem' },
    { label: 'Three Branches', href: '#branches' },
    { label: 'Mechanism', href: '#mechanism' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Results', href: '#results' },
    { label: 'Outage Demo', href: '#demo' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled || activeView === 'prototype'
          ? 'bg-[#060911]/90 backdrop-blur-md border-b border-slate-800/80 shadow-2xl py-3'
          : 'bg-transparent border-b border-white/5 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition font-mono">
                  VYRA
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-400">
                  Adaptive
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-mono">
                GNSS / DR Resilience
              </span>
            </div>
          </button>
        </div>

        {/* Center Links (Shown in landing view) */}
        {activeView === 'landing' && (
          <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300 font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-cyan-400 transition tracking-wide text-slate-400 hover:text-slate-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenResearchModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
          >
            <span>Research Tables</span>
          </button>

          {activeView === 'landing' ? (
            <button
              onClick={() => onViewChange('prototype')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>LAUNCH PROTOTYPE</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
            </button>
          ) : (
            <button
              onClick={() => onViewChange('landing')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>OVERVIEW PAGE</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
