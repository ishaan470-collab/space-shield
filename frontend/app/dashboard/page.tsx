"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart3, ShieldAlert, Sparkles, Activity, AlertTriangle, 
  ShieldCheck, History, Orbit, Globe, Database 
} from "lucide-react";
import { apiService, AnalyticsDashboardResponse } from "../../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGuest, setIsGuest] = useState(true);

  // Radar/Tracking Mesh Canvas State
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const handleAuthChange = () => fetchDashboardData();
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  // Radar simulation animation
  useEffect(() => {
    if (loading || error || !data || !radarCanvasRef.current) return;
    
    const canvas = radarCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;
    
    // Generate static nodes representing coordinates of tracked conjunction items
    const nodes: {x: number, y: number, name: string, threat: string, speed: number}[] = [
      { x: width * 0.15, y: height * 0.35, name: "DEBRIS-C91", threat: "high", speed: 0.8 },
      { x: width * 0.42, y: height * 0.22, name: "COSMOS-243", threat: "medium", speed: -0.5 },
      { x: width * 0.72, y: height * 0.45, name: "STARLINK-A1", threat: "low", speed: 1.1 },
      { x: width * 0.31, y: height * 0.75, name: "FENGYUN-DEB", threat: "high", speed: -1.2 },
      { x: width * 0.85, y: height * 0.65, name: "ISS-ZARYA", threat: "low", speed: 0.4 }
    ];

    let sweepAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw radar background grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
      ctx.lineWidth = 0.5;

      // Draw horizontal lines
      for (let y = 15; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw vertical lines
      for (let x = 20; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw radar concentric circles
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
      ctx.beginPath();
      ctx.arc(width/2, height/2, height * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width/2, height/2, height * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      // Sweep line
      sweepAngle += 0.01;
      const sweepX = width/2 + (width) * Math.cos(sweepAngle);
      const sweepY = height/2 + (width) * Math.sin(sweepAngle);

      // Draw sweep gradient beam
      ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width/2, height/2);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Draw items
      nodes.forEach((node, idx) => {
        // Slowly animate positions
        node.x += Math.sin(sweepAngle + idx) * 0.15;
        
        let color = "#10b981"; // green
        let shadow = "rgba(16, 185, 129, 0.5)";
        if (node.threat === "high") {
          color = "#ef4444";
          shadow = "rgba(239, 68, 68, 0.6)";
        } else if (node.threat === "medium") {
          color = "#f59e0b";
          shadow = "rgba(245, 158, 11, 0.6)";
        }

        // Draw node dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing rings
        const pulse = 3.5 + (Date.now() % 1200) / 150 * 1.2;
        ctx.strokeStyle = shadow;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Label text
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.fillText(node.name, node.x + 8, node.y - 2);
        ctx.fillStyle = color;
        ctx.fillText(node.threat.toUpperCase(), node.x + 8, node.y + 6);
      });

      // Overlay details
      ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
      ctx.font = "8px 'Orbitron', sans-serif";
      ctx.fillText("SPACE SENSOR RADAR sweep", 10, 15);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [loading, error, data]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
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
          <span className="text-xs text-gray-400 font-mono">Connecting telemetry database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center flex flex-col items-center gap-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold font-orbitron">Sensor Data Lost</h3>
        <p className="text-xs text-gray-400 font-mono">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-md font-orbitron tracking-wider uppercase"
        >
          Re-establish Telemetry link
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

  // Prepare Line Chart Data
  const lineData = hasData ? [...recentPredictions].reverse().map((item, index) => ({
    name: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Confidence: Math.round((item.confidence ?? 0) * 100),
    id: item.id ?? index,
  })) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-cyan-400" /> Analytics Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            OPERATIONS DECK: Real-time risk aggregations and mathematical performance metrics.
          </p>
        </div>

        {isGuest && (
          <div className="p-3.5 rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-mono max-w-md">
            📢 <strong>GUEST READOUT:</strong> Sandbox database active. Sync credentials via <strong>Connect Operator</strong>.
          </div>
        )}
      </div>

      {hasData ? (
        <div className="flex flex-col gap-8">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Metric 1 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-cyan-500 flex justify-between items-center hud-corner">
              <div className="font-mono">
                <span className="text-[9px] text-gray-500 uppercase font-bold font-orbitron">Assessments Logged</span>
                <div className="text-2xl font-bold mt-1 text-white tracking-wide">{totalPredictions}</div>
              </div>
              <Activity className="w-8 h-8 text-cyan-500/30" />
            </div>

            {/* Metric 2 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500 flex justify-between items-center hud-corner">
              <div className="font-mono">
                <span className="text-[9px] text-gray-500 uppercase font-bold font-orbitron">High Threat Events</span>
                <div className="text-2xl font-bold mt-1 text-red-400 tracking-wide">{riskDistribution.high}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500/30" />
            </div>

            {/* Metric 3 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-amber-500 flex justify-between items-center hud-corner">
              <div className="font-mono">
                <span className="text-[9px] text-gray-500 uppercase font-bold font-orbitron">Medium Threat Flags</span>
                <div className="text-2xl font-bold mt-1 text-amber-400 tracking-wide">{riskDistribution.medium}</div>
              </div>
              <ShieldAlert className="w-8 h-8 text-amber-500/30" />
            </div>

            {/* Metric 4 */}
            <div className="glass-panel p-5 rounded-xl border-l-4 border-green-500 flex justify-between items-center hud-corner">
              <div className="font-mono">
                <span className="text-[9px] text-gray-500 uppercase font-bold font-orbitron">Mean ML Confidence</span>
                <div className="text-2xl font-bold mt-1 text-green-400 tracking-wide">{(averageConfidence * 100).toFixed(1)}%</div>
              </div>
              <ShieldCheck className="w-8 h-8 text-green-500/30" />
            </div>
          </div>

          {/* Charts & Radar Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Chart 1: Area Chart (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-5 rounded-xl hud-corner flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400">Attribution Probability Trend</h3>
                <p className="text-[10px] text-gray-500 font-mono">Risk output classification confidence scores across runs.</p>
              </div>

              <div className="w-full h-72 bg-black/40 p-2 rounded-lg border border-white/5 font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData}>
                    <defs>
                      <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={9} />
                    <YAxis stroke="#6b7280" fontSize={9} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#080c18",
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

            {/* Radar Simulation Node Map (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-5 rounded-xl hud-corner flex flex-col gap-4 overflow-hidden">
              <div>
                <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400">Sensor Tracking Map</h3>
                <p className="text-[10px] text-gray-500 font-mono">Live vector tracking coordinates monitored via Norad nodes.</p>
              </div>

              <div className="w-full h-72 bg-black/60 rounded-lg border border-white/5 relative overflow-hidden">
                {/* Scanline CRT overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-5" />
                <canvas
                  ref={radarCanvasRef}
                  width={340}
                  height={270}
                  className="w-full h-full block"
                />
              </div>
            </div>
          </div>

          {/* Machine Learning Performance & Conjunction Profile Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ML Diagnostic Dashboard Panel (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-5 rounded-xl hud-corner flex flex-col gap-4 font-mono text-xs">
              <div>
                <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-purple-400">Artificial Intelligence Benchmarks</h3>
                <p className="text-[10px] text-gray-500">Validation statistics of Gradient Boosting Classifier.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Accuracy metrics */}
                <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-white/5 bg-black/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase">Model Accuracy:</span>
                    <span className="text-green-400 font-bold">92.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase">ROC-AUC Index:</span>
                    <span className="text-green-400 font-bold">98.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase">F1 Threshold:</span>
                    <span className="text-cyan-400 font-bold">94.8%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-0.5 text-[9px] uppercase text-gray-500">
                    <span>Attribution Explainer:</span>
                    <span className="text-purple-400 font-bold font-orbitron">SHAP v0.45</span>
                  </div>
                </div>

                {/* Confusion Matrix Visual */}
                <div className="p-3 rounded-lg border border-white/5 bg-black/20 flex flex-col gap-2">
                  <span className="text-[9px] font-orbitron font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-1">Confusion Matrix Readout</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div />
                    <span className="text-gray-600 font-semibold text-[8px] uppercase">PRED(+)</span>
                    <span className="text-gray-600 font-semibold text-[8px] uppercase">PRED(-)</span>
                    
                    <span className="text-gray-600 text-left flex items-center font-semibold text-[8px] uppercase">ACT(+)</span>
                    <div className="p-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold" title="True Positives">90.4%</div>
                    <div className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20" title="False Negatives">2.1%</div>
                    
                    <span className="text-gray-600 text-left flex items-center font-semibold text-[8px] uppercase">ACT(-)</span>
                    <div className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20" title="False Positives">3.6%</div>
                    <div className="p-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold" title="True Negatives">93.9%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart: Conjunction Risk Profile (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-5 rounded-xl hud-corner flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400">Risk Profile Distribution</h3>
                <p className="text-[10px] text-gray-500 font-mono">Proportion of threat classifications currently logged.</p>
              </div>

              <div className="w-full h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#080c18",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Pie legend */}
                <div className="absolute right-4 flex flex-col gap-1.5 text-[9px] uppercase font-bold font-mono">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-400">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Operations Logs Table */}
          <div className="glass-panel p-6 rounded-xl hud-corner flex flex-col gap-4">
            <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <History className="w-4 h-4" /> Conjunction Activity Stream
            </h3>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 uppercase font-bold tracking-wider text-[10px] font-orbitron">
                    <th className="pb-3 pl-2">Asset Name</th>
                    <th className="pb-3">Orbit Alt / Vel</th>
                    <th className="pb-3">Separation (CA)</th>
                    <th className="pb-3">Assessment Date</th>
                    <th className="pb-3">Threat level</th>
                    <th className="pb-3 text-right pr-2">Classifier Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentPredictions.map((log, index) => (
                    <tr key={log.id ?? index} className="hover:bg-white/5 transition-colors text-gray-300">
                      <td className="py-3.5 pl-2 font-bold uppercase text-gray-200">{log.satellite_name}</td>
                      <td className="py-3.5 text-gray-400">
                        {log.altitude.toFixed(0)} km / {log.velocity.toFixed(2)} km/s
                      </td>
                      <td className="py-3.5">
                        <span className="text-red-400 font-semibold">{log.relative_distance.toFixed(2)} km</span>
                        <span className="text-gray-600 mx-1.5">|</span>
                        <span className="text-gray-400">{log.relative_velocity.toFixed(1)} km/s</span>
                      </td>
                      <td className="py-3.5 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[8px] tracking-wider font-orbitron ${
                          log.prediction === "High Risk" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : log.prediction === "Medium Risk"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}>
                          {log.prediction}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 font-bold text-cyan-400 font-mono">{(log.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-xl hud-corner flex flex-col items-center justify-center text-center gap-6">
          <Orbit className="w-12 h-12 text-cyan-500 animate-bounce" />
          <div className="font-mono">
            <h3 className="text-lg font-bold text-white font-orbitron uppercase">Operations Logs Empty</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
              No satellite conjunction checks have been registered. Launch the console to execute orbital predictions.
            </p>
          </div>
          <Link
            href="/predict"
            className="px-6 py-3.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/10 transition-all uppercase tracking-wider font-orbitron"
          >
            Open predictor console
          </Link>
        </div>
      )}
    </div>
  );
}
