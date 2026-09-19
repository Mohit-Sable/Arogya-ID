import React, { useState } from 'react';

export default function GlassmorphicCard() {
  const [activeTab, setActiveTab] = useState('telemetry');

  return (
    <div className="relative min-h-[460px] w-full flex items-center justify-center p-6 overflow-hidden rounded-2xl bg-slate-950 font-sans my-4">
      {/* 1. Rich, Colorful Ambient Gradient Mesh Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0f19] via-[#1a1236] to-[#0d1e38] pointer-events-none" />
      
      {/* Ambient glowing color spheres for authentic glass refraction */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/25 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/25 rounded-full blur-3xl animate-pulse pointer-events-none [animation-delay:2s]" />
      <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 shadow-2xl shadow-black/40 p-7 transition-all duration-300 hover:shadow-cyan-500/10 hover:border-white/30">
        
        {/* Specular hairline top glow */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-900/80 rounded-[10px] flex items-center justify-center text-cyan-300 text-xl font-bold">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  HealthNet Sovereign ID
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-300/80 font-mono mt-0.5">
                NODE // HID-8924-4102-X9
              </p>
            </div>
          </div>

          {/* Live Heartbeat Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono text-emerald-300 font-medium">LIVE</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 my-5 bg-black/25 rounded-lg border border-white/10">
          {['telemetry', 'consents', 'diagnostics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white/20 text-white shadow-sm shadow-black/20 border border-white/15'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Blood Group
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1 flex items-baseline gap-1.5">
              O+ <span className="text-xs font-sans text-rose-400 font-medium">Rh+</span>
            </div>
            <div className="text-[11px] text-slate-300/70 mt-1">Antigen Verified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Telemetry Vitals
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-1 flex items-baseline gap-1.5">
              72 <span className="text-xs text-slate-300 font-normal">bpm</span>
            </div>
            <div className="text-[11px] text-slate-300/70 mt-1">SpO2: 99% • Sinus Rhythm</div>
          </div>
        </div>

        {/* Emergency Alert Tag */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 mb-6 text-xs text-rose-200">
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-semibold text-rose-100">Critical Contraindication:</span> Penicillin (Anaphylaxis risk).
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all duration-150 active:scale-[0.98]">
            Transmit Telemetry
          </button>
          <button className="py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all duration-150 active:scale-[0.98]">
            Lock Vault
          </button>
        </div>

      </div>
    </div>
  );
}
