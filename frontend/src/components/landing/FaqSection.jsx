import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Cpu, ShieldCheck, Scale, Compass, Activity, Database } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      question: "How does VYRA differ from classical Extended Kalman Filter residual gating?",
      answer: "Standard EKF architectures use Normalized Innovation Squared (NIS) gating or chi-square validation tests. While effective at rejecting gross outliers, NIS gating is strictly reactive: it detects corrupted observations only after they arrive at the antenna. By that time, multipath delays and Doppler anomalies have already begun biasing the covariance state. Furthermore, when satellite geometry hovers near the gating threshold, NIS gating causes rapid 'chattering' (switching back and forth). VYRA, by contrast, anticipates prospective error trajectories across candidates {GNSS, HYBRID, DR} over a 3.0s lookahead window and enforces hysteresis dwells, avoiding chattering entirely.",
      icon: Activity,
    },
    {
      question: "Why formulate Action-Conditioned Forecasting instead of a binary GNSS outage classifier?",
      answer: "A binary outage classifier answers only: 'Will GNSS fail?' It cannot evaluate how safe Dead Reckoning will be. Dead reckoning error growth is heavily state-dependent: at 10 km/h driving straight, DR stays within 5.0m for over 25 seconds; but at 90 km/h during an aggressive cornering maneuver, gyroscope bias and tire scrub expand error past 5.0m in less than 4 seconds. By conditioning the forecast on both candidate action and forward horizon H, VYRA predicts the actual metric that matters: the future maximum Euclidean position error ê(t, A, H).",
      icon: Cpu,
    },
    {
      question: "How is the closed-form bi-quadratic DR survivability duration T_surv derived?",
      answer: "We model horizontal dead-reckoning error variance via a continuous-time Lyapunov equation resulting in a 4th-order polynomial: σ_pos²(T) = σ_0² + σ_v² T² + (1/3) v² σ_ψ0² T² + (1/12) v² σ_ω² T⁴. Assuming a 2D Rayleigh distribution of horizontal positioning error under safety bound E_thresh = 5.0m, the median survivable bound occurs when σ_pos²(T) reaches σ_target² = E_thresh² / (2 ln 2) ≈ 18.0337 m². By substituting u = T², this reduces to a bi-quadratic polynomial a u² + b u + c = 0 whose analytical positive real root yields T_surv in < 0.05 μs.",
      icon: Compass,
    },
    {
      question: "How does VYRA achieve 0.0% chattering without delaying emergency maneuvers?",
      answer: "VYRA implements a dual-layer regularization mechanism: (1) A 0.5m hysteresis cost margin J(M_{t-1}) - J(A*) > 0.5m prevents switching unless the candidate mode is significantly superior. (2) A minimum dwell time τ_dwell = 2.0s (20 epochs) enforces temporal stability. To prevent delayed reactions during catastrophic signal corruption, an Emergency Safety Override immediately bypasses the dwell time if the predicted error exceeds 15.0m or composite quality Q_t drops below 0.20.",
      icon: Scale,
    },
    {
      question: "What dataset was used, and how was zero data leakage guaranteed?",
      answer: "VYRA was trained and evaluated on 170,243 authentic 10 Hz epochs (4.72 hours) from the IO-VNBD benchmark dataset (Onyekpeu et al., Coventry University), featuring synchronized CAN wheel speeds, 3-axis tactical IMU, and RTK GNSS ground truth. Strict trajectory-level partitioning was enforced: Training on V-S1 (51,194 epochs), validation and calibration on V-S2 (94,428 epochs), and final held-out testing exclusively on V-S3a (24,621 epochs). All scalers were fitted exclusively on V-S1.",
      icon: Database,
    },
    {
      question: "Can VYRA run in real-time on production automotive microcontrollers?",
      answer: "Yes. The XGBoost decision ensemble inference for all 3 candidate actions executes in approximately 1.8 milliseconds on a standard single-core CPU, well within the 100 millisecond (10 Hz) real-time budget. The analytical T_surv root calculation requires negligible compute (< 0.05 μs).",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#080d18] border-b border-slate-800/80 relative">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400 tracking-widest mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Research Insights. <br />
            <span className="text-slate-400">Deep Technical FAQ.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            Detailed mathematical and algorithmic clarifications addressing key design decisions,
            theoretical guarantees, and real-world deployment considerations.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const Icon = faq.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#0d1424] border-blue-500/50 shadow-lg'
                    : 'bg-[#0b101e]/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full px-6 py-4.5 flex items-center justify-between text-left gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg border ${
                      isOpen
                        ? 'bg-blue-600/20 text-cyan-400 border-blue-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-sm sm:text-base font-semibold text-slate-200">
                      {faq.question}
                    </span>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-xs sm:text-sm font-normal text-slate-300 leading-relaxed border-t border-slate-800/60 font-sans">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
