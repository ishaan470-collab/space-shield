"use client";

import Link from "next/link";
import { Compass, ShieldAlert, BarChart3, BookOpen, Orbit, Globe, Sparkles, Database, Layers } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Live Orbital Telemetry",
      description: "Sync active orbital coordinates (such as the ISS, Hubble telescope, or Starlink satellites) dynamically from NORAD CelesTrak ephemeris caches.",
      icon: Orbit,
      color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    },
    {
      title: "Neural Threat Predictor",
      description: "Uses a trained Gradient Boosting tree ensemble to assess crossing angles, speeds, and close approach separation vectors for collision risks.",
      icon: ShieldAlert,
      color: "text-red-400 border-red-500/20 bg-red-500/5",
    },
    {
      title: "Explainable AI (XAI)",
      description: "Inspect neural feature attributions powered by SHAP to diagnose precisely which physical coefficients influenced the threat classification.",
      icon: Sparkles,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    },
    {
      title: "Avoidance Solver (CAS)",
      description: "Compute prograde and retrograde delta-v burn parameters to dynamically adjust altitudes and evasion routes to mitigate hazard alerts.",
      icon: Layers,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    },
  ];

  const quickStats = [
    { label: "Tracked Space Debris", value: "35,000+" },
    { label: "Active Satellites", value: "9,800+" },
    { label: "Mean Velocity (LEO)", value: "28,000 km/h" },
    { label: "ML Classification accuracy", value: "92.4%" },
  ];

  return (
    <div className="flex-grow flex flex-col justify-center items-center py-16 px-4 relative overflow-hidden">
      {/* Scanline overlay across hero */}
      <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-5" />

      {/* Cyber Grid mesh overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.03),transparent_60%)] pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-5xl w-full text-center relative z-10 flex flex-col items-center">
        
        {/* Terminal status pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-mono mb-8 animate-pulse shadow-md shadow-cyan-500/5 font-orbitron tracking-widest uppercase">
          <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "10s" }} /> 
          Space Situational Awareness Operations Deck
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold font-orbitron tracking-tight mb-8 leading-tight">
          PREDICT ORBITAL COLLISIONS WITH{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent text-glow-cyan">
            EXPLAINABLE AI
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-3xl mb-12 leading-relaxed font-mono">
          With millions of orbital debris items traveling at nearly 28,000 km/h, satellite safety is critical. SpaceShield predicts collision risks in real time using Machine Learning models trained on physical orbital parameters.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto font-orbitron">
          <Link
            href="/predict"
            className="flex items-center gap-2 px-10 py-4.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:from-cyan-400 hover:to-purple-500 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transform hover:-translate-y-0.5 transition-all text-sm w-full sm:w-auto text-center justify-center cursor-pointer tracking-wider uppercase"
          >
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "15s" }} />
            Open Predictor Console
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-10 py-4.5 rounded-lg glass-panel hover:bg-white/5 border border-white/10 text-gray-200 font-bold transform hover:-translate-y-0.5 transition-all text-sm w-full sm:w-auto text-center justify-center cursor-pointer tracking-wider uppercase"
          >
            <BarChart3 className="w-5 h-5 text-purple-400" />
            View Analytics Dashboard
          </Link>
        </div>

        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-24">
          {quickStats.map((stat, i) => (
            <div key={i} className="glass-panel p-5 rounded-xl border border-white/5 text-center hud-corner font-mono">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent mb-1 font-orbitron">
                {stat.value}
              </div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-orbitron">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grids */}
      <div className="max-w-6xl w-full relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold font-orbitron text-center mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase tracking-wider">
          End-to-End Space Situational Awareness
        </h2>
        <p className="text-center text-xs font-mono text-gray-400 max-w-2xl mx-auto mb-16 uppercase tracking-wider">
          SpaceShield bridges the gap between complex orbital astrophysics and explainable risk analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 rounded-xl hover:border-cyan-500/30 transition-all group flex gap-4 hud-corner"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 ${feature.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-orbitron text-gray-100 mb-2 group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-mono">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kessler Syndrome Section (Interactive educational hook) */}
      <div className="max-w-6xl w-full mt-24 relative z-10">
        <div className="glass-panel p-8 sm:p-12 rounded-xl border border-white/10 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-gray-950/20 via-slate-900/10 to-indigo-950/10 hud-corner alert-pulse-yellow">
          <div className="flex-1 font-mono">
            <div className="text-[9px] font-bold font-orbitron text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 animate-pulse" /> High Risk Orbital Physics
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-bold font-orbitron text-white mb-4 uppercase tracking-wider">
              What is the Kessler Syndrome?
            </h2>
            
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Proposed by NASA scientist Donald J. Kessler in 1978, it is a scenario where the density of objects in Low Earth Orbit is high enough that collisions trigger a cascade — each collision generating debris that increases the likelihood of further collisions. This could render space activities and satellite operations impossible for generations.
            </p>
            
            <Link
              href="/education"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold text-xs font-orbitron uppercase tracking-wider group"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              Explore Space Education Module
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="w-full md:w-80 h-64 relative border border-cyan-500/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-black/50">
            {/* Visual satellite mockup using pure CSS */}
            <div className="w-40 h-40 rounded-full border border-dashed border-cyan-500/20 animate-orbit absolute" />
            <div className="w-24 h-24 rounded-full border border-dashed border-purple-500/30 animate-spin absolute" />
            
            <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-400 flex items-center justify-center relative z-10 animate-pulse shadow-2xl shadow-blue-500">
              <Globe className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: "30s" }} />
            </div>

            {/* Satellite dot */}
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400 top-12 left-16 animate-ping" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-purple-500 bottom-16 right-20 animate-bounce" />
            
            {/* Debris particles */}
            <div className="absolute w-1 h-1 rounded-full bg-red-400 top-20 right-14" />
            <div className="absolute w-1 h-1 rounded-full bg-gray-400 bottom-24 left-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
