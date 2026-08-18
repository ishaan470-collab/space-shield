"use client";

import React, { useState, useEffect } from "react";
import { History, FileDown, Trash2, ShieldAlert, Activity, GitCompare, X, Eye } from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this prediction log?")) return;
    
    try {
      await apiService.deleteHistory(id);
      // Remove from state
      setHistory(prev => prev.filter(item => item.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      // Dispatch event to update other views like dashboard
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
          alert("You can compare a maximum of 3 predictions side-by-side.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const getRiskStyle = (risk: string) => {
    if (risk === "High Risk") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (risk === "Medium Risk") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-green-500/10 text-green-400 border border-green-500/20";
  };

  // Filter history based on search query
  const filteredHistory = history.filter(item =>
    item.satellite_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Selected predictions for comparison
  const comparisonItems = history.filter(item => selectedIds.includes(item.id as number));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <History className="w-8 h-8 text-cyan-400" /> Predictions Log Room
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse through previous collision hazard reports, compare metrics, and generate printable PDF dossiers.
          </p>
        </div>

        {selectedIds.length > 1 && (
          <button
            onClick={() => setIsComparing(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-sm font-bold rounded-lg shadow-md transition-all uppercase tracking-wider cursor-pointer"
          >
            <GitCompare className="w-4 h-4" /> Compare Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm text-gray-400 font-mono">Retrieving archives...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-sm max-w-lg mx-auto text-center flex flex-col gap-4">
          <span>{error}</span>
          <button onClick={fetchHistory} className="bg-red-500 text-black px-4 py-2 rounded font-semibold text-xs self-center">Retry</button>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-16 rounded-xl text-center flex flex-col items-center gap-4 max-w-xl mx-auto">
          <ShieldAlert className="w-12 h-12 text-cyan-500 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-200">No Predictions Logged</h3>
          <p className="text-sm text-gray-400">
            Assessments sandbox is empty. Head to the Predictor tab to simulate orbital threat cases.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Search filter */}
          <div className="glass-panel p-4 rounded-lg flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search by satellite name..."
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery("")} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comparison Modal/Panel */}
          {isComparing && comparisonItems.length > 0 && (
            <div className="glass-panel p-6 rounded-xl border border-cyan-500/30 relative">
              <button
                onClick={() => setIsComparing(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mb-4">
                <GitCompare className="w-5 h-5 text-purple-400" /> Telemetry Comparison matrix
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/10">
                  <thead>
                    <tr className="text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Metrics Parameter</th>
                      {comparisonItems.map(item => (
                        <th key={item.id} className="pb-3 px-4 font-bold text-cyan-300 uppercase">
                          {item.satellite_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Threat Level</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${getRiskStyle(item.prediction)}`}>
                            {item.prediction}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">ML Confidence</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-gray-200 font-bold">
                          {(item.confidence * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Orbit Altitude</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-gray-300">
                          {item.altitude.toFixed(0)} km
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Orbital Speed</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-gray-300">
                          {item.velocity.toFixed(2)} km/s
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Inclination</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-gray-300">
                          {item.inclination.toFixed(2)}°
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Orbital Period</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-gray-300">
                          {item.orbital_period.toFixed(1)} min
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Debris Separation Distance</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-red-400 font-bold">
                          {item.relative_distance.toFixed(2)} km
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Debris Crossing Speed</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4 text-red-400">
                          {item.relative_velocity.toFixed(1)} km/s
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 font-sans text-gray-400">Dossier Actions</td>
                      {comparisonItems.map(item => (
                        <td key={item.id} className="py-3 px-4">
                          <button
                            onClick={() => generateCollisionReport(item)}
                            className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 hover:border-cyan-500/30 px-2.5 py-1 rounded text-cyan-400 font-bold uppercase transition-all"
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
          )}

          {/* Logs list */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Logged Conjunction Runs ({filteredHistory.length})</h3>
              <span className="text-[10px] text-gray-500 font-mono">Select up to 3 check-boxes to run side-by-side matrices.</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase font-semibold tracking-wider">
                    <th className="pb-3 pl-2 w-8">Select</th>
                    <th className="pb-3 pl-2">Asset Name</th>
                    <th className="pb-3">Orbit Alt / Vel</th>
                    <th className="pb-3">Clearance (CA)</th>
                    <th className="pb-3">Threat class</th>
                    <th className="pb-3">Date Assessment</th>
                    <th className="pb-3 text-right pr-2">Report Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 pl-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id as number)}
                          onChange={() => handleSelectCheckbox(item.id as number)}
                          className="w-4 h-4 rounded border-gray-700 bg-black/50 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-2 font-bold uppercase text-gray-200">{item.satellite_name}</td>
                      <td className="py-3.5 font-mono text-gray-400">
                        {item.altitude.toFixed(0)} km / {item.velocity.toFixed(2)} km/s
                      </td>
                      <td className="py-3.5 font-mono text-red-400 font-semibold">
                        {item.relative_distance.toFixed(2)} km / {item.relative_velocity.toFixed(1)} km/s
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] tracking-wide ${getRiskStyle(item.prediction)}`}>
                          {item.prediction}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => generateCollisionReport(item)}
                            className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Export Conjunction PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id as number)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete Conjunction Log"
                          >
                            <Trash2 className="w-4 h-4" />
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
