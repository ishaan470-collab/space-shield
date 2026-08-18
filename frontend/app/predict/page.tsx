"use client";

import React, { useState, useEffect } from "react";
import { Compass, Search, Orbit, ShieldAlert, Sparkles, RefreshCw, Info, HelpCircle } from "lucide-react";
import { apiService, PredictRequest, PredictResponse, SatelliteSearchResponse } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function PredictPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [loadedSat, setLoadedSat] = useState<SatelliteSearchResponse | null>(null);

  // Form inputs
  const [satelliteName, setSatelliteName] = useState("Unknown Satellite");
  const [altitude, setAltitude] = useState<number>(400);
  const [velocity, setVelocity] = useState<number>(7.67);
  const [inclination, setInclination] = useState<number>(51.64);
  const [orbitalPeriod, setOrbitalPeriod] = useState<number>(92.8);
  const [relativeDistance, setRelativeDistance] = useState<number>(5.2);
  const [relativeVelocity, setRelativeVelocity] = useState<number>(10.5);

  // Prediction output state
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [result, setResult] = useState<PredictResponse | null>(null);

  // Sync inputs if a satellite is loaded from Celestrak
  const handleLoadSatellite = (sat: SatelliteSearchResponse) => {
    setLoadedSat(sat);
    setSatelliteName(sat.satellite_name);
    setAltitude(sat.altitude);
    setVelocity(sat.velocity);
    setInclination(sat.inclination);
    setOrbitalPeriod(sat.orbital_period);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError("");
    try {
      const data = await apiService.searchSatellite(searchQuery);
      handleLoadSatellite(data);
    } catch (err: any) {
      setSearchError(err.message || "Failed to search satellite. Showing offline data instead.");
    } finally {
      setSearching(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPredictionError("");
    setResult(null);

    const payload: PredictRequest = {
      satellite_name: satelliteName,
      altitude,
      velocity,
      inclination,
      orbital_period: orbitalPeriod,
      relative_distance: relativeDistance,
      relative_velocity: relativeVelocity,
    };

    try {
      const res = await apiService.predict(payload);
      setResult(res);
      // Dispatch custom event to notify other components (e.g. Navbar for history)
      window.dispatchEvent(new Event("auth_change"));
    } catch (err: any) {
      setPredictionError(err.message || "Prediction failed.");
    } finally {
      setPredicting(false);
    }
  };

  // Run initial prediction for demo
  useEffect(() => {
    handlePredict();
  }, []);

  // Format feature importance data for Recharts
  const getChartData = () => {
    if (!result || !result.feature_importance) return [];
    return Object.entries(result.feature_importance).map(([key, value]) => ({
      name: key,
      importance: Math.round(value * 100),
    })).sort((a, b) => b.importance - a.importance);
  };

  const getRiskColor = (risk: string) => {
    if (risk === "High Risk") return "text-red-500 border-red-500/20 bg-red-500/10";
    if (risk === "Medium Risk") return "text-warning-500 border-amber-500/20 bg-amber-500/10 text-amber-400";
    return "text-green-500 border-green-500/20 bg-green-500/10";
  };

  const getGaugeColor = (risk: string) => {
    if (risk === "High Risk") return "#ef4444";
    if (risk === "Medium Risk") return "#f59e0b";
    return "#10b981";
  };

  const chartData = getChartData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <Compass className="w-8 h-8 text-cyan-400" /> Orbital Collision Predictor
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Conduct a proximity hazard risk assessment using machine learning algorithms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Live Search Widget */}
          <div className="glass-panel p-5 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Live Satellite Import
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Query Celestrak by name or NORAD Catalog ID to load actual orbital parameters.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search: ISS, Hubble, Starlink, etc."
                className="flex-grow bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Query"}
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-red-400 mt-2 font-medium">{searchError}</p>
            )}
            {loadedSat && (
              <div className="mt-4 p-3 rounded-lg border border-cyan-500/10 bg-cyan-950/10 flex items-center justify-between text-xs">
                <div>
                  <span className="block font-bold text-cyan-400 uppercase">{loadedSat.satellite_name}</span>
                  <span className="text-gray-500 font-mono">NORAD #{loadedSat.norad_id} | Ecc: {loadedSat.eccentricity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoadedSat(null);
                    setSatelliteName("Unknown Satellite");
                  }}
                  className="text-gray-400 hover:text-red-400 text-[10px] font-bold tracking-widest uppercase border border-white/5 px-2 py-1 rounded"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Configuration Parameters Panel */}
          <div className="glass-panel p-5 rounded-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Orbit className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} /> Telemetry adjustment
            </h3>

            {/* Satellite name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Target Satellite Name
              </label>
              <input
                type="text"
                value={satelliteName}
                onChange={(e) => setSatelliteName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            {/* Slider 1: Altitude */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Satellite Altitude</span>
                <span className="font-mono text-cyan-400">{altitude.toFixed(0)} km</span>
              </div>
              <input
                type="range"
                min="150"
                max="2000"
                step="5"
                value={altitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAltitude(val);
                  // Update period and velocity mathematically for accuracy if not custom override
                  const r = 6371.0 + val;
                  const v = Math.sqrt(398600.44 / r);
                  const p = (2.0 * Math.PI * Math.sqrt(r**3 / 398600.44)) / 60.0;
                  setVelocity(parseFloat(v.toFixed(2)));
                  setOrbitalPeriod(parseFloat(p.toFixed(1)));
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 2: Velocity */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Satellite Orbital Velocity</span>
                <span className="font-mono text-cyan-400">{velocity.toFixed(2)} km/s</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.05"
                value={velocity}
                onChange={(e) => setVelocity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 3: Inclination */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Orbital Inclination</span>
                <span className="font-mono text-cyan-400">{inclination.toFixed(2)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="0.5"
                value={inclination}
                onChange={(e) => setInclination(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 4: Orbital Period */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Orbital Period</span>
                <span className="font-mono text-cyan-400">{orbitalPeriod.toFixed(1)} mins</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                step="0.5"
                value={orbitalPeriod}
                onChange={(e) => setOrbitalPeriod(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="h-px bg-white/10 my-1" />

            {/* Slider 5: Debris Relative Distance */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Debris Proximity Distance</span>
                <span className="font-mono text-red-400">{relativeDistance.toFixed(2)} km</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="40"
                step="0.1"
                value={relativeDistance}
                onChange={(e) => setRelativeDistance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="text-[10px] text-gray-500">Separation at closest approach point (CA).</span>
            </div>

            {/* Slider 6: Debris Relative Velocity */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1 text-gray-400">
                <span>Debris Relative Velocity</span>
                <span className="font-mono text-red-400">{relativeVelocity.toFixed(1)} km/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="16.0"
                step="0.1"
                value={relativeVelocity}
                onChange={(e) => setRelativeVelocity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="text-[10px] text-gray-500">Differential speed vector (crossing velocity).</span>
            </div>

            {/* Assessment trigger */}
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3 rounded-lg text-sm shadow-lg shadow-cyan-500/10 transition-all uppercase tracking-wide cursor-pointer disabled:opacity-50 mt-2"
            >
              {predicting ? "Running Calculations..." : "Execute Risk Assessment"}
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Outcomes (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {predictionError && (
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-sm">
              {predictionError}
            </div>
          )}

          {result ? (
            <div className="flex flex-col gap-6">
              {/* Gauge and metrics panel */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-panel p-6 rounded-xl relative overflow-hidden">
                {/* Glow ring in background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Gauge (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-6">
                  <div className="w-36 h-36 relative flex items-center justify-center">
                    {/* SVG Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={getGaugeColor(result.prediction)}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - result.confidence)}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    {/* Gauge label */}
                    <div className="absolute flex flex-col items-center text-center">
                      <span className="text-2xl font-bold font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">Confidence</span>
                    </div>
                  </div>

                  <div className={`mt-4 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getRiskColor(result.prediction)}`}>
                    {result.prediction}
                  </div>
                </div>

                {/* Satellite telemetry summary card (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider">Assessment Target</span>
                    <h2 className="text-xl font-bold text-gray-100 uppercase tracking-wide mt-0.5">{result.satellite_name}</h2>
                    <span className="text-xs text-gray-500 font-mono">Calculated at: {new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 border-t border-white/5 pt-4">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Altitude</span>
                      <span className="text-sm font-semibold font-mono text-gray-200">{result.altitude.toFixed(0)} km</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Orbit Velocity</span>
                      <span className="text-sm font-semibold font-mono text-gray-200">{result.velocity.toFixed(2)} km/s</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Inclination</span>
                      <span className="text-sm font-semibold font-mono text-gray-200">{result.inclination.toFixed(2)}°</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Period</span>
                      <span className="text-sm font-semibold font-mono text-gray-200">{result.orbital_period.toFixed(1)} mins</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Debris Distance</span>
                      <span className="text-sm font-semibold font-mono text-red-400">{result.relative_distance.toFixed(2)} km</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Relative Speed</span>
                      <span className="text-sm font-semibold font-mono text-red-400">{result.relative_velocity.toFixed(1)} km/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable AI Dashboard */}
              <div className="glass-panel p-6 rounded-xl flex flex-col gap-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> Explainable AI (XAI) Diagnosis
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Neural attribution breakdown showing the weight of factors influencing this specific collision risk classification.
                  </p>
                </div>

                {/* Natural Language Explanations */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Physics Interpretation
                  </span>
                  <div className="flex flex-col gap-2 bg-black/30 p-4 rounded-lg border border-white/5">
                    {result.explanation && result.explanation.map((note, index) => (
                      <div key={index} className="flex gap-2 text-xs leading-relaxed text-gray-300">
                        <span className="text-cyan-400 font-bold font-mono">▶</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recharts Feature Importance Graph */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Feature Importance Contributions
                  </span>
                  <div className="w-full h-56 bg-black/20 p-2 rounded-lg border border-white/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#4b5563" fontSize={10} unit="%" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#9ca3af"
                          fontSize={10}
                          tickLine={false}
                          width={110}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: "11px",
                            borderRadius: "6px",
                          }}
                          formatter={(value) => [`${value}% Contribution`, "Importance"]}
                        />
                        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => {
                            // Assign color based on feature importance
                            let barColor = "#06b6d4"; // default cyan
                            if (entry.name.includes("Distance")) barColor = "#ef4444"; // red
                            if (entry.name.includes("Velocity")) barColor = "#ec4899"; // pink
                            if (entry.name.includes("Inclination")) barColor = "#8b5cf6"; // purple
                            return <Cell key={`cell-${index}`} fill={barColor} fillOpacity={0.8} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center gap-4 flex-grow">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
              <div>
                <h3 className="font-bold text-gray-200">Processing Telemetry Parameters</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Loading the diagnostic environment. Adjust sliders to re-calculate risk metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
