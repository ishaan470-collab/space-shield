"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, Search, Orbit, ShieldAlert, Sparkles, 
  RefreshCw, Info, HelpCircle, FileText, Zap, 
  ChevronDown, ChevronUp, Sliders, CheckCircle 
} from "lucide-react";
import { apiService, PredictRequest, PredictResponse, SatelliteSearchResponse } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import OrbitalSimulation from "../../components/OrbitalSimulation";

export default function PredictPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [loadedSat, setLoadedSat] = useState<SatelliteSearchResponse | null>(null);

  // TLE parsing panel state
  const [showTleDecoder, setShowTleDecoder] = useState(false);
  const [tleInput, setTleInput] = useState("");
  const [tleError, setTleError] = useState("");
  const [tleSuccess, setTleSuccess] = useState(false);

  // Form inputs
  const [satelliteName, setSatelliteName] = useState("Unknown Satellite");
  const [altitude, setAltitude] = useState<number>(400);
  const [velocity, setVelocity] = useState<number>(7.67);
  const [inclination, setInclination] = useState<number>(51.64);
  const [orbitalPeriod, setOrbitalPeriod] = useState<number>(92.8);
  const [relativeDistance, setRelativeDistance] = useState<number>(5.2);
  const [relativeVelocity, setRelativeVelocity] = useState<number>(10.5);

  // Evasion maneuver simulation state
  const [evasionActive, setEvasionActive] = useState(false);
  const [evasionBurnSimulated, setEvasionBurnSimulated] = useState(false);
  const [evasionDeltaV, setEvasionDeltaV] = useState(0);
  const [evasionAltitudeShift, setEvasionAltitudeShift] = useState(0);
  const [evasionFuelHydrazine, setEvasionFuelHydrazine] = useState(0);
  const [recalculatingRisk, setRecalculatingRisk] = useState(false);

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
    // Reset evasion burn simulation when loading new satellite
    resetEvasionManeuver();
  };

  // Reset Evasion Burn parameters
  const resetEvasionManeuver = () => {
    setEvasionActive(false);
    setEvasionBurnSimulated(false);
    setEvasionDeltaV(0);
    setEvasionAltitudeShift(0);
    setEvasionFuelHydrazine(0);
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

  // Decode standard NORAD TLE parameters
  const handleDecodeTle = (e: React.FormEvent) => {
    e.preventDefault();
    setTleError("");
    setTleSuccess(false);

    try {
      const lines = tleInput.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      let name = "Decoded Asset";
      let line1 = "";
      let line2 = "";

      if (lines.length === 3) {
        name = lines[0];
        line1 = lines[1];
        line2 = lines[2];
      } else if (lines.length === 2) {
        line1 = lines[0];
        line2 = lines[1];
      } else {
        throw new Error("TLE must contain exactly 2 or 3 lines.");
      }

      if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
        throw new Error("Line 1 must start with '1 ' and Line 2 must start with '2 '.");
      }

      // Inclination (degrees) - Line 2, chars 8 to 16
      const inclinationStr = line2.substring(8, 16).trim();
      const parsedInclination = parseFloat(inclinationStr);

      // Mean Motion (revolutions per day) - Line 2, chars 52 to 63
      const meanMotionStr = line2.substring(52, 63).trim();
      const meanMotion = parseFloat(meanMotionStr);

      if (isNaN(parsedInclination) || isNaN(meanMotion)) {
        throw new Error("Invalid number formats in TLE lines.");
      }

      // Keplerian Physics Formulas
      const periodMins = 1440.0 / meanMotion;
      const periodSecs = periodMins * 60;
      
      const GM = 398600.4418; // Earth gravitational parameter (km^3/s^2)
      const semiMajorAxis = Math.pow((GM * Math.pow(periodSecs, 2)) / (4 * Math.pow(Math.PI, 2)), 1 / 3);
      const earthRadius = 6371.0;
      const calculatedAltitude = semiMajorAxis - earthRadius;
      const calculatedVelocity = Math.sqrt(GM / semiMajorAxis);

      // Update state parameters
      setSatelliteName(name);
      setAltitude(Math.min(2000, Math.max(150, calculatedAltitude)));
      setVelocity(Math.min(12, Math.max(3, calculatedVelocity)));
      setInclination(Math.min(180, Math.max(0, parsedInclination)));
      setOrbitalPeriod(Math.min(150, Math.max(80, periodMins)));

      setTleSuccess(true);
      setTleInput("");
      resetEvasionManeuver();
    } catch (err: any) {
      setTleError(err.message || "Decoding failed. Check TLE characters alignment.");
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPredictionError("");
    
    // Maintain result if we are recalculating risk dynamically
    if (!recalculatingRisk) {
      setResult(null);
    }

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
      setRecalculatingRisk(false);
    }
  };

  // Run initial prediction for demo
  useEffect(() => {
    handlePredict();
  }, []);

  // Solve evasive collision avoidance maneuver
  const handleSolveEvasionManeuver = () => {
    if (!result) return;
    setEvasionActive(true);
    setEvasionBurnSimulated(true);

    // Calculate required delta-v and orbital adjustments
    // A standard debris avoidance maneuver seeks to shift the orbital period to clear closest approach.
    // E.g., for safety margin of > 5.5km:
    const currentDist = relativeDistance;
    const requiredSeparation = 6.2; // km
    const deficit = requiredSeparation - currentDist;

    // Direct physics approximation of delta-V burn for small orbital shifts
    // delta_V = (V_orbital * delta_a) / (4 * a)
    const semiMajorAxis = altitude + 6371.0;
    const altitudeShift = Math.max(2.5, deficit * 2.1); // km shift
    const deltaV = ((velocity * 1000) * altitudeShift) / (4 * semiMajorAxis); // meters per second

    // Hydrazine fuel consumption estimate (assuming 800kg dry mass satellite, Isp = 220s)
    // m_fuel = m_dry * (exp(delta_V / (Isp * g)) - 1)
    const dryMass = 850; // kg
    const Isp = 220; // seconds
    const g = 9.81;
    const fuelUsed = dryMass * (Math.exp(deltaV / (Isp * g)) - 1);

    setEvasionDeltaV(deltaV);
    setEvasionAltitudeShift(altitudeShift);
    setEvasionFuelHydrazine(fuelUsed);
  };

  // Apply Evasive Maneuver parameters and submit recalculation
  const handleExecuteEvasiveManeuver = () => {
    setRecalculatingRisk(true);
    
    // Shift altitude up by the calculated shift
    const newAltitude = altitude + evasionAltitudeShift;
    setAltitude(parseFloat(newAltitude.toFixed(2)));

    // Recalculate velocity mathematically for circular orbit at new altitude
    const r = 6371.0 + newAltitude;
    const v = Math.sqrt(398600.44 / r);
    const p = (2.0 * Math.PI * Math.sqrt(r**3 / 398600.44)) / 60.0;
    setVelocity(parseFloat(v.toFixed(2)));
    setOrbitalPeriod(parseFloat(p.toFixed(1)));

    // Set relative distance to a safe crossing clearance
    const safeDistance = relativeDistance + evasionAltitudeShift;
    setRelativeDistance(parseFloat(safeDistance.toFixed(2)));

    // Hide active burn line display but keep log
    setEvasionActive(false);

    // Triggers useEffect telemetry refresh / predict
  };

  // Trigger predict when telemetry updates due to evasive execution
  useEffect(() => {
    if (recalculatingRisk) {
      handlePredict();
    }
  }, [recalculatingRisk]);

  // Format feature importance data for Recharts
  const getChartData = () => {
    if (!result || !result.feature_importance) return [];
    return Object.entries(result.feature_importance).map(([key, value]) => ({
      name: key,
      importance: Math.round(value * 100),
    })).sort((a, b) => b.importance - a.importance);
  };

  const getRiskColor = (risk: string) => {
    if (risk === "High Risk") return "text-red-400 border-red-500/25 bg-red-500/5";
    if (risk === "Medium Risk") return "text-amber-400 border-amber-500/25 bg-amber-500/5";
    return "text-green-400 border-green-500/25 bg-green-500/5";
  };

  const getGaugeColor = (risk: string) => {
    if (risk === "High Risk") return "#ef4444";
    if (risk === "Medium Risk") return "#f59e0b";
    return "#10b981";
  };

  const chartData = getChartData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <Compass className="w-8 h-8 text-cyan-400" /> Space Operations Room
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            MISSION CONTROLLER HUD: Adjust orbital telemetry coefficients or import NORAD TLE blocks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form & TLE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Live Search Widget */}
          <div className="glass-panel p-5 rounded-xl hud-corner">
            <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Live Satellite Query
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Fetch active telemetry coordinates directly from CelesTrak cache.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ISS, Hubble, Starlink..."
                className="flex-grow bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center shrink-0 disabled:opacity-50 font-orbitron"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Query"}
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-red-400 mt-2 font-mono">{searchError}</p>
            )}
            {loadedSat && (
              <div className="mt-4 p-3 rounded-lg border border-cyan-500/10 bg-cyan-950/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="block font-bold text-cyan-400 uppercase">{loadedSat.satellite_name}</span>
                  <span className="text-gray-500 text-[10px]">NORAD #{loadedSat.norad_id} | ECCENTRICITY: {loadedSat.eccentricity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoadedSat(null);
                    setSatelliteName("Unknown Satellite");
                    resetEvasionManeuver();
                  }}
                  className="text-gray-400 hover:text-red-400 text-[9px] font-bold tracking-widest uppercase border border-white/5 px-2 py-1 rounded"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* TLE Decrypter Panel */}
          <div className="glass-panel p-5 rounded-xl hud-corner">
            <button
              onClick={() => setShowTleDecoder(!showTleDecoder)}
              className="w-full flex items-center justify-between text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Two-Line Element (TLE) Decoder
              </span>
              {showTleDecoder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTleDecoder && (
              <form onSubmit={handleDecodeTle} className="mt-4 flex flex-col gap-3">
                <p className="text-[10px] text-gray-500 font-mono">
                  Paste standard 2-line or 3-line TLE format. The decoder computes altitude and velocity using Keplerian equations.
                </p>
                <textarea
                  value={tleInput}
                  onChange={(e) => setTleInput(e.target.value)}
                  placeholder={`ISS (ZARYA)
1 25544U 98067A   23244.53120370  .00016717  00000-0  30786-3 0  9994
2 25544  51.6437  23.8291 0005706 130.6866 317.0673 15.49887467413645`}
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 rounded-md p-2.5 text-[10px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-normal"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 text-cyan-400 font-orbitron font-semibold text-xs tracking-wider uppercase transition-all"
                >
                  Decode & Load Vectors
                </button>
                {tleError && (
                  <p className="text-[10px] text-red-400 font-mono bg-red-950/20 p-2 rounded border border-red-500/10">{tleError}</p>
                )}
                {tleSuccess && (
                  <p className="text-[10px] text-green-400 font-mono bg-green-950/20 p-2 rounded border border-green-500/10">
                    ✔️ Orbital parameters parsed and synchronized successfully.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Telemetry Adjustments HUD Sliders */}
          <div className="glass-panel p-5 rounded-xl hud-corner flex flex-col gap-5">
            <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Telemetry Vector Matrix
            </h3>

            {/* Satellite name */}
            <div>
              <label className="block text-[10px] font-orbitron font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Target Satellite ID
              </label>
              <input
                type="text"
                value={satelliteName}
                onChange={(e) => {
                  setSatelliteName(e.target.value);
                  resetEvasionManeuver();
                }}
                className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 font-bold uppercase tracking-wider"
              />
            </div>

            {/* Slider 1: Altitude */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Satellite Altitude (a - Re)</span>
                <span className="font-mono text-cyan-400">{altitude.toFixed(1)} km</span>
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
                  resetEvasionManeuver();
                  // Keplerian sync
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
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Satellite Orbital Velocity (V)</span>
                <span className="font-mono text-cyan-400">{velocity.toFixed(2)} km/s</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.05"
                value={velocity}
                onChange={(e) => {
                  setVelocity(parseFloat(e.target.value));
                  resetEvasionManeuver();
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 3: Inclination */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Orbit Planar Inclination (i)</span>
                <span className="font-mono text-cyan-400">{inclination.toFixed(2)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="0.5"
                value={inclination}
                onChange={(e) => {
                  setInclination(parseFloat(e.target.value));
                  resetEvasionManeuver();
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 4: Orbital Period */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Keplerian Period (T)</span>
                <span className="font-mono text-cyan-400">{orbitalPeriod.toFixed(1)} mins</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                step="0.5"
                value={orbitalPeriod}
                onChange={(e) => {
                  setOrbitalPeriod(parseFloat(e.target.value));
                  resetEvasionManeuver();
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="hud-laser-line my-1" />

            {/* Slider 5: Debris Relative Distance */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Debris Conjunction Proximity (CA)</span>
                <span className="font-mono text-red-400">{relativeDistance.toFixed(2)} km</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="40"
                step="0.1"
                value={relativeDistance}
                onChange={(e) => {
                  setRelativeDistance(parseFloat(e.target.value));
                  resetEvasionManeuver();
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Slider 6: Debris Relative Velocity */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 text-gray-400 font-orbitron">
                <span>Debris Relative Velocity (dV)</span>
                <span className="font-mono text-red-400">{relativeVelocity.toFixed(1)} km/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="16.0"
                step="0.1"
                value={relativeVelocity}
                onChange={(e) => {
                  setRelativeVelocity(parseFloat(e.target.value));
                  resetEvasionManeuver();
                }}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Run prediction button */}
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-lg text-xs tracking-wider shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all uppercase cursor-pointer disabled:opacity-50 mt-2 font-orbitron"
            >
              {predicting ? "Running Neural Attribution..." : "Run Threat Analysis"}
            </button>
          </div>
        </div>

        {/* Right Column: Prediction Outcomes & Simulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Interactive Simulation Dashboard */}
          <div className="w-full">
            <OrbitalSimulation
              altitude={altitude}
              velocity={velocity}
              inclination={inclination}
              relativeDistance={relativeDistance}
              relativeVelocity={relativeVelocity}
              risk={result?.prediction || "Low Risk"}
              evasionActive={evasionActive}
              evasionBurnDeltaV={evasionDeltaV}
            />
          </div>

          {predictionError && (
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs font-mono">
              {predictionError}
            </div>
          )}

          {result ? (
            <div className="flex flex-col gap-6">
              
              {/* Gauge and metrics panel */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-panel p-6 rounded-xl hud-corner relative overflow-hidden">
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
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={getGaugeColor(result.prediction)}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - result.confidence)}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    {/* Gauge label */}
                    <div className="absolute flex flex-col items-center text-center">
                      <span className="text-2xl font-bold font-orbitron font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                      <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold font-orbitron">Confidence</span>
                    </div>
                  </div>

                  <div className={`mt-4 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider font-orbitron ${getRiskColor(result.prediction)}`}>
                    {result.prediction}
                  </div>
                </div>

                {/* Satellite telemetry summary card (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-cyan-400 font-orbitron font-bold uppercase tracking-wider">Telemetry Vectors</span>
                    <h2 className="text-lg font-bold text-gray-100 uppercase tracking-wide mt-0.5">{result.satellite_name}</h2>
                    <span className="text-[10px] text-gray-500 font-mono">Report Epoch: {new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 border-t border-white/5 pt-4">
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Altitude</span>
                      <span className="text-xs font-bold text-gray-200">{result.altitude.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Velocity</span>
                      <span className="text-xs font-bold text-gray-200">{result.velocity.toFixed(2)} km/s</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Inclination</span>
                      <span className="text-xs font-bold text-gray-200">{result.inclination.toFixed(2)}°</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Period</span>
                      <span className="text-xs font-bold text-gray-200">{result.orbital_period.toFixed(1)} mins</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Debris Distance</span>
                      <span className="text-xs font-bold text-red-400">{result.relative_distance.toFixed(2)} km</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Relative Velocity</span>
                      <span className="text-xs font-bold text-red-400">{result.relative_velocity.toFixed(1)} km/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collision Avoidance System Evasion Burn (CAS) */}
              {(result.prediction === "High Risk" || result.prediction === "Medium Risk" || evasionBurnSimulated) && (
                <div className={`glass-panel p-5 rounded-xl hud-corner border ${
                  result.prediction === "High Risk" 
                    ? "alert-pulse-red" 
                    : result.prediction === "Medium Risk" 
                    ? "alert-pulse-yellow" 
                    : "border-cyan-500/20"
                }`}>
                  <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className={`w-4 h-4 ${evasionBurnSimulated ? "text-cyan-400" : "text-amber-500 animate-bounce"}`} /> 
                    🛰️ Collision Avoidance System (CAS)
                  </h3>
                  
                  {!evasionBurnSimulated ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                        Potential conjunction path crossing warning. Simulate propulsive orbit correction maneuvers ($\Delta v$ delta-v altitude adjustment) to restore safe orbital clearance bounds.
                      </p>
                      <button
                        onClick={handleSolveEvasionManeuver}
                        className="py-2.5 rounded bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 hover:border-red-500/40 font-orbitron font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Initiate Evasive Burn Simulation
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3 font-mono text-xs text-gray-300">
                      <div className="p-3 bg-black/40 rounded border border-cyan-500/10 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] text-cyan-400 font-bold font-orbitron uppercase border-b border-white/5 pb-1">
                          <span>Maneuver Parameters</span>
                          <span>Calculated Safe Burn</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Maneuver Vector:</span>
                          <span className="font-bold text-white">PROGRADE ORBIT RAISE</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Required Burn Δv:</span>
                          <span className="font-bold text-cyan-300">{evasionDeltaV.toFixed(2)} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Altitude Adjustment:</span>
                          <span className="font-bold text-cyan-300">+{evasionAltitudeShift.toFixed(2)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fuel Requirement (Hydrazine):</span>
                          <span className="font-bold text-purple-300">{evasionFuelHydrazine.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] uppercase font-bold text-green-400 font-orbitron">
                          <span>Target Clearance Margin:</span>
                          <span>&gt; {(relativeDistance + evasionAltitudeShift).toFixed(2)} km (SAFE)</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleExecuteEvasiveManeuver}
                          disabled={recalculatingRisk}
                          className="flex-grow py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          {recalculatingRisk ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing Burn...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> Execute Evasive Maneuver
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetEvasionManeuver}
                          className="px-4 py-2.5 rounded border border-white/10 text-gray-400 hover:text-white text-xs font-orbitron uppercase tracking-wider font-semibold hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explainable AI Dashboard */}
              <div className="glass-panel p-6 rounded-xl hud-corner flex flex-col gap-6">
                <div>
                  <h3 className="text-xs font-orbitron font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" /> neural attribution breakdown (XAI)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Diagnostic attribution chart showing which parameters heavily influenced this specific risk classification.
                  </p>
                </div>

                {/* Natural Language Explanations */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-orbitron font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Physical Explanations
                  </span>
                  <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-xs text-gray-300">
                    {result.explanation && result.explanation.map((note, index) => (
                      <div key={index} className="flex gap-2 leading-relaxed">
                        <span className="text-cyan-400 font-bold">▶</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recharts Feature Importance Graph */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-orbitron font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Factor Weights Distribution
                  </span>
                  <div className="w-full h-56 bg-black/40 p-2 rounded-lg border border-white/5">
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
                          fontSize={9}
                          tickLine={false}
                          width={110}
                          className="font-mono"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#080c18",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: "11px",
                            borderRadius: "6px",
                          }}
                          formatter={(value) => [`${value}% Contribution`, "Attribution"]}
                        />
                        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => {
                            let barColor = "#06b6d4"; // default cyan
                            if (entry.name.includes("Distance")) barColor = "#ef4444"; // red
                            if (entry.name.includes("Velocity")) barColor = "#ec4899"; // pink
                            if (entry.name.includes("Inclination")) barColor = "#8b5cf6"; // purple
                            return <Cell key={`cell-${index}`} fill={barColor} fillOpacity={0.85} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center gap-4 flex-grow font-mono">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
              <div>
                <h3 className="font-bold text-gray-200">Decoding Telemetry Coordinates...</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Loading the physical diagnostic environment. Adjust sliders to re-calculate risk metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
