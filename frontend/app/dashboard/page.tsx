"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, ShieldAlert, Sparkles, Activity, AlertTriangle, ShieldCheck, History, Orbit } from "lucide-react";
import { apiService, AnalyticsDashboardResponse } from "../../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, Legend } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh if login status changes
    const handleAuthChange = () => fetchDashboardData();
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      // Check if logged in
      const token = localStorage.getItem("spaceshield_token");
      setIsGuest(!token);

      const res = await apiService.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-gray-400 font-mono">Loading operations database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center flex flex-col items-center gap-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold">Dashboard Error</h3>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm rounded-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalPredictions = data?.total_predictions ?? 0;
  const averageConfidence = data?.average_confidence ?? 0;
  const riskDistribution = data?.risk_distribution ?? { low: 0, medium: 0, high: 0 };
  const recentPredictions = data?.recent_predictions ?? [];
  const hasData = totalPredictions > 0;

  // Prepare Pie Chart Data
  const pieData = hasData ? [
    { name: "Low Risk", value: riskDistribution.low, color: "#10b981" },
    { name: "Medium Risk", value: riskDistribution.medium, color: "#f59e0b" },
    { name: "High Risk", value: riskDistribution.high, color: "#ef4444" }
  ].filter(item => item.value > 0) : [];

  // Prepare Line Chart Data from recent predictions
  const lineData = hasData ? [...recentPredictions].reverse().map((item, index) => ({
    name: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Confidence: Math.round((item.confidence ?? 0) * 100),
    Risk: item.prediction === "High Risk" ? 3 : item.prediction === "Medium Risk" ? 2 : 1,
    id: item.id ?? index,
  })) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-cyan-400" /> Analytics Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Historical stats and risk distribution summary of logged satellite conjunction assessments.
          </p>
        </div>

        {isGuest && (
          <div className="p-3.5 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs max-w-md">
            📢 <strong>Guest Operator Mode:</strong> You are viewing global sandbox logs. Click <strong>Connect Operator</strong> in the header to save and analyze private assets.
          </div>
        )}
      </div>

      {hasData ? (
        <div className="flex flex-col gap-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Metric 1 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-cyan-500 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Assessments Performed</span>
                <div className="text-2xl font-bold font-mono mt-1">{totalPredictions}</div>
              </div>
              <Activity className="w-8 h-8 text-cyan-500/40" />
            </div>

            {/* Metric 2 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">High Risk Conjunctions</span>
                <div className="text-2xl font-bold font-mono mt-1 text-red-400">{riskDistribution.high}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500/40" />
            </div>

            {/* Metric 3 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-amber-500 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Medium Risk Flagged</span>
                <div className="text-2xl font-bold font-mono mt-1 text-amber-400">{riskDistribution.medium}</div>
              </div>
              <ShieldAlert className="w-8 h-8 text-amber-500/40" />
            </div>

            {/* Metric 4 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-green-500 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Average ML Confidence</span>
                <div className="text-2xl font-bold font-mono mt-1 text-green-400">{(averageConfidence * 100).toFixed(1)}%</div>
              </div>
              <ShieldCheck className="w-8 h-8 text-green-500/40" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart 1: Area Chart (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-5 rounded-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Assessment Confidence Trend</h3>
                <p className="text-[11px] text-gray-500">Calculated probabilities across the last sequential runs.</p>
              </div>

              <div className="w-full h-72 bg-black/20 p-2 rounded-lg border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData}>
                    <defs>
                      <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "6px",
                      }}
                    />
                    <Area type="monotone" dataKey="Confidence" stroke="#06b6d4" fillOpacity={1} fill="url(#colorConf)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pie Chart (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-5 rounded-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Risk Profile Distribution</h3>
                <p className="text-[11px] text-gray-500">Proportion of Low, Medium, and High threat scenarios.</p>
              </div>

              <div className="w-full h-72 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Pie legend */}
                <div className="absolute bottom-4 flex gap-6 text-[10px] uppercase font-semibold">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-400">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Operations Logs Table */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <History className="w-4 h-4" /> Conjunction Activity Stream
            </h3>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase font-semibold tracking-wider">
                    <th className="pb-3 pl-2">Asset Name</th>
                    <th className="pb-3">Orbit Alt / Vel</th>
                    <th className="pb-3">Proximity</th>
                    <th className="pb-3">Assessment Date</th>
                    <th className="pb-3">Threat level</th>
                    <th className="pb-3 text-right pr-2">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentPredictions.map((log, index) => (
                    <tr key={log.id ?? index} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 pl-2 font-bold uppercase text-gray-200">{log.satellite_name}</td>
                      <td className="py-3.5 font-mono text-gray-400">
                        {log.altitude.toFixed(0)} km / {log.velocity.toFixed(2)} km/s
                      </td>
                      <td className="py-3.5 font-mono">
                        <span className="text-red-400">{log.relative_distance.toFixed(2)} km</span>
                        <span className="text-gray-600 mx-1.5">|</span>
                        <span className="text-gray-400">{log.relative_velocity.toFixed(1)} km/s</span>
                      </td>
                      <td className="py-3.5 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] tracking-wide ${
                          log.prediction === "High Risk" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : log.prediction === "Medium Risk"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}>
                          {log.prediction}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 font-bold font-mono">{(log.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-xl flex flex-col items-center justify-center text-center gap-6">
          <Orbit className="w-12 h-12 text-cyan-500 animate-bounce" />
          <div>
            <h3 className="text-xl font-bold">Operations Logs Empty</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
              No satellite collision risk calculations have been logged. Open the Predictor Console to run your first conjunction assessment.
            </p>
          </div>
          <Link
            href="/predict"
            className="px-6 py-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/10 transition-all uppercase tracking-wide"
          >
            Launch Predictor
          </Link>
        </div>
      )}
    </div>
  );
}
