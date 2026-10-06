import React, { useState } from 'react';
import { GitBranch, Radio, Activity, Compass, AlertCircle, ShieldCheck, TrendingUp } from 'lucide-react';

export default function ThreePossibilities3D() {
  const [selectedBranch, setSelectedBranch] = useState('HYBRID');

  const branches = [
    {
      id: 'GNSS',
      name: 'A1: GNSS-Direct',
      badge: 'Satellite Direct',
      color: 'sky',
      textColor: 'text-sky-400',
      bgColor: 'bg-sky-950/20',
      borderColor: 'border-sky-500/40',
      icon: Radio,
      futureDynamics: 'Subject to multipath outliers and sudden signal loss. Zero inertial smoothing.',
      forecastHorizon: 'τ = 3.0 s',
      predictedErrorBehavior: 'High variance; spikes beyond 5.0m during urban canyon shadowing.',
      thresholdRisk: 'Elevated (P_viol > 0.85 when Qt drops below 0.30)',
      uncertaintyEnvelope: 'Unbounded during complete receiver signal loss (disqualified)',
      actionMechanics: 'Raw satellite receiver pseudorange/Doppler fix without inertial state prediction.',
    },
    {
      id: 'HYBRID',
      name: 'A2: Fixed HYBRID',
      badge: 'Continuous EKF',
      color: 'emerald',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-500/40',
      icon: Activity,
      futureDynamics: 'Continuous loosely-coupled EKF fusion. Fuses wheel speed, gyro yaw rate, and GNSS.',
      forecastHorizon: 'τ = 3.0 s',
      predictedErrorBehavior: 'Minimal error (< 0.8m) under nominal or quality-attenuated observations.',
      thresholdRisk: 'Low when adaptive R-matrix inflation attenuates noisy innovations.',
      uncertaintyEnvelope: 'Bounded covariance: Tr(P) remains stable while satellite updates persist.',
      actionMechanics: 'Propagates 6-state kinematics with quality-weighted Joseph-form measurement updates.',
    },
    {
      id: 'DR',
      name: 'A3: Pure DR',
      badge: 'Strapdown Inertial',
      color: 'amber',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-500/40',
      icon: Compass,
      futureDynamics: 'Immune to satellite multipath and jamming. Error grows quadratically over duration.',
      forecastHorizon: 'τ = 3.0 s',
      predictedErrorBehavior: 'Drift governed by sigma_pos^2(T) = sigma_0^2 + sigma_v^2 T^2 + 1/3 v^2 sigma_theta^2 T^2.',
      thresholdRisk: 'Zero risk if outage duration T < T_surv; risk increases if T > T_surv.',
      uncertaintyEnvelope: 'Monotonically expanding error ellipse; valid until 5.0m safety breach.',
      actionMechanics: 'Propagates position and heading solely from wheel odometry speed and gyroscope.',
    },
  ];

  const active = branches.find((b) => b.id === selectedBranch) || branches[1];

  return (
    <section id="branches" className="py-24 bg-[#060911] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 tracking-widest mb-3">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Counterfactual Decision Modeling</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Three Future Paths. <br />
            <span className="text-slate-400">One Resilient Choice.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            At decision time t, the future consequences of every candidate action are evaluated
            concurrently across lookahead horizon τ = 3.0s.
          </p>
        </div>

        {/* Central Architecture & 3 Branch Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left / Top: Interactive Branch Selectors */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              Select Candidate Action to Inspect:
            </div>

            {branches.map((b) => {
              const Icon = b.icon;
              const isSelected = selectedBranch === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranch(b.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? `${b.borderColor} ${b.bgColor} ring-2 ring-blue-500/30 shadow-lg`
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-slate-900' : 'bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${b.textColor}`} />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-200">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.badge}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelected ? 'Active Focus' : 'Inspect'}
                  </span>
                </div>
              );
            })}

            {/* Note on Decision Mechanism */}
            <div className="mt-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-400 font-mono">
              <span className="text-slate-300 font-bold">Policy Cost Formulation:</span>
              <br />
              {"J(A) = ê_max(A, τ) + β · E_thresh · P_viol(A) + λ_switch · I(A ≠ M_t-1) + Π_DR(A)"}
            </div>
          </div>

          {/* Right: Detailed Counterfactual Inspection Panel */}
          <div className="lg:col-span-7 bg-[#0a0f1d] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-3">
                  <active.icon className={`w-5 h-5 ${active.textColor}`} />
                  <div>
                    <h3 className="font-mono text-base font-bold text-white uppercase">{active.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">Lookahead Horizon: {active.forecastHorizon}</span>
                  </div>
                </div>
                <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono">
                  Conceptual Mechanism
                </span>
              </div>

              {/* Data attributes grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono mb-6">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Predicted Error Dynamics</div>
                  <div className="text-slate-200 mt-1 font-semibold text-[11px] leading-relaxed">
                    {active.predictedErrorBehavior}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] uppercase">Error Bound Risk (&gt; 5.0m)</div>
                  <div className="text-slate-200 mt-1 font-semibold text-[11px] leading-relaxed">
                    {active.thresholdRisk}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 sm:col-span-2">
                  <div className="text-slate-500 text-[10px] uppercase">Uncertainty Envelope Evolution</div>
                  <div className="text-slate-200 mt-1 font-semibold text-[11px] leading-relaxed">
                    {active.uncertaintyEnvelope}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Action Mechanics & Safety Conditions:
                </div>
                <p className="text-slate-400 text-[11px]">{active.actionMechanics}</p>
              </div>
            </div>

            {/* Bottom disclosure */}
            <div className="mt-6 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Candidate Evaluation at epoch t</span>
              <span>Prevents Late Handover Spikes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
