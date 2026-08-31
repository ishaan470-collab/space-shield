"use client";

import React, { useState, useEffect } from "react";
import { History, FileDown, Trash2, ShieldAlert, Activity, GitCompare, X, AlertTriangle } from "lucide-react";
import { apiService, PredictResponse } from "../../services/api";
import { generateCollisionReport } from "../../utils/pdfGenerator";

export default function HistoryPage() {
  const [history, setHistory] = useState<PredictResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering and selection
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    fetchHistory();
    const handleAuthChange = () => fetchHistory();
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("spaceshield_token");
      setIsGuest(!token);

      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load prediction history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Confirm deleting this telemetry file from logs?")) return;
    
    try {
      await apiService.deleteHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      window.dispatchEvent(new Event("auth_change"));
    } catch (err: any) {
      alert(err.message || "Failed to delete prediction record.");
    }
  };

  const handleSelectCheckbox = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 3) {
          alert("Maximum of 3 satellites can be compared at one time.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const getRiskStyle = (risk: string) => {
    if (risk === "High Risk") return "bg-red-500/10 text-red-400 border border-red-500/25";
    if (risk === "Medium Risk") return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
    return "bg-green-500/10 text-green-400 border border-green-500/25";
  };

  const getRiskBadgeColor = (risk: string) => {
    if (risk === "High Risk") return "text-red-400 font-bold text-glow-red";
    if (risk === "Medium Risk") return "text-amber-400 font-bold text-glow-purple";
    return "text-green-400 font-bold text-glow-green";
  };

  const filteredHistory = history.filter(item =>
    item.satellite_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const comparisonItems = history.filter(item => selectedIds.includes(item.id as number));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <History className="w-8 h-8 text-cyan-400" /> Archival Log Room
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            ARCHIVE DECK: Review historical calculations, export PDF dossiers, and run delta-v comparison sheets.
          </p>
        </div>

        {selectedIds.length > 1 && (
          <button
            onClick={() => setIsComparing(true)}
            className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold font-orbitron rounded-lg shadow-md transition-all uppercase tracking-wider cursor-pointer"
          >
            <GitCompare className="w-4 h-4 animate-pulse" /> Run Matrix Comparison ({selectedIds.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-gray-400 font-mono font-semibold">Decrypting space dossiers...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs font-mono max-w-lg mx-auto text-center flex flex-col gap-4">
          <span>{error}</span>
          <button onClick={fetchHistory} className="bg-red-500 text-black px-4 py-2 rounded font-bold font-orbitron text-[10px] self-center">Retry connection</button>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-16 rounded-xl text-center flex flex-col items-center gap-4 max-w-xl mx-auto hud-corner">
          <ShieldAlert className="w-12 h-12 text-cyan-500 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-200 font-orbitron uppercase">No Conjunctions Logged</h3>
          <p className="text-xs text-gray-400 font-mono">
            Archive bank is clear. Navigate to the Predictor Console to save telemetry runs.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Search filter input */}
          <div className="glass-panel p-4 rounded-lg flex items-center gap-2 max-w-md hud-corner">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search dossier name..."
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery("")} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comparison Matrix Modal Overlay */}
          {isComparing && comparisonItems.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <div className="glass-panel-glow w-full max-w-4xl p-6 sm:p-8 rounded-xl relative overflow-y-auto max-h-[90vh] hud-corner">
                <button
                  onClick={() => setIsComparing(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-sm font-orbitron font-bold text-cyan-400 flex items-center gap-2 mb-6 uppercase tracking-wider">
                  <GitCompare className="w-5 h-5 text-purple-400 animate-pulse" /> Telemetry Comparison Matrix
                </h2>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs divide-y divide-white/10 font-mono">
                    <thead>
                      <tr className="text-gray-500 font-bold uppercase tracking-wider text-[10px] font-orbitron border-b border-white/10">
                        <th className="pb-4 pr-4">Metrics parameters</th>
                        {comparisonItems.map(item => (
                          <th key={item.id} className="pb-4 px-4 font-bold text-cyan-300 uppercase tracking-widest text-[9px] font-orbitron">
                            {item.satellite_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      <tr>
                        <td className="py-3.5 text-gray-500">Threat Level</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[8px] font-orbitron ${getRiskStyle(item.prediction)}`}>
                              {item.prediction}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">ML Confidence</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className={`py-3.5 px-4 font-bold ${getRiskBadgeColor(item.prediction)}`}>
                            {(item.confidence * 100).toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Orbit Altitude</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-gray-200">
                            {item.altitude.toFixed(1)} km
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Orbital Speed</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-gray-200">
                            {item.velocity.toFixed(2)} km/s
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Inclination</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-gray-200">
                            {item.inclination.toFixed(2)}°
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Orbital Period</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-gray-200">
                            {item.orbital_period.toFixed(1)} mins
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Debris Separation (CA)</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-red-400 font-bold">
                            {item.relative_distance.toFixed(2)} km
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3.5 text-gray-500">Crossing Velocity</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-3.5 px-4 text-red-400">
                            {item.relative_velocity.toFixed(1)} km/s
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="py-4 text-gray-500">Dossier Actions</td>
                        {comparisonItems.map(item => (
                          <td key={item.id} className="py-4 px-4">
                            <button
                              onClick={() => generateCollisionReport(item)}
                              className="flex items-center gap-1 text-[9px] bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black px-2.5 py-1.5 rounded text-cyan-400 font-bold uppercase transition-all font-orbitron"
                            >
                              <FileDown className="w-3.5 h-3.5" /> PDF
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Logs table list */}
          <div className="glass-panel p-6 rounded-xl hud-corner flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400">Tracked archives ({filteredHistory.length})</h3>
              <span className="text-[9px] text-gray-500 font-mono">Select up to 3 parameters checkboxes to generate comparison matrix charts.</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 uppercase font-bold tracking-wider text-[10px] font-orbitron">
                    <th className="pb-3 pl-2 w-8">Select</th>
                    <th className="pb-3 pl-2">Asset Identifier</th>
                    <th className="pb-3">Orbit Alt / Vel</th>
                    <th className="pb-3">Clearance (CA)</th>
                    <th className="pb-3">Threat Profile</th>
                    <th className="pb-3">Epoch log</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 pl-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id as number)}
                          onChange={() => handleSelectCheckbox(item.id as number)}
                          className="w-4 h-4 rounded border-gray-800 bg-black/50 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-2 font-bold uppercase text-gray-200">{item.satellite_name}</td>
                      <td className="py-3.5 text-gray-400 font-mono">
                        {item.altitude.toFixed(0)} km / {item.velocity.toFixed(2)} km/s
                      </td>
                      <td className="py-3.5 text-red-400 font-semibold font-mono">
                        {item.relative_distance.toFixed(2)} km / {item.relative_velocity.toFixed(1)} km/s
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[8px] tracking-wider font-orbitron ${getRiskStyle(item.prediction)}`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => generateCollisionReport(item)}
                            className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Export PDF Dossier"
                          >
                            <FileDown className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id as number)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                            title="Purge Log"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
