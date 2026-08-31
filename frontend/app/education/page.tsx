"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Orbit, Globe, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Sliders, Info } from "lucide-react";

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState<"orbits" | "debris" | "mechanics">("orbits");

  // Sandbox state
  const [semiMajorAxis, setSemiMajorAxis] = useState<number>(6771); // LEO altitude + Re (400km + 6371km)
  const [period, setPeriod] = useState<number>(92.6);
  const [speed, setSpeed] = useState<number>(7.67);
  const [zoneName, setZoneName] = useState<string>("Low Earth Orbit (LEO)");

  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef<number>(0);

  // Recalculate parameters when semiMajorAxis changes
  useEffect(() => {
    const GM = 398600.4418; // km^3/s^2
    const a = semiMajorAxis;
    
    // Kepler's Third Law
    const tSeconds = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM);
    const tMinutes = tSeconds / 60;
    
    // Orbital velocity
    const v = Math.sqrt(GM / a);

    setPeriod(tMinutes);
    setSpeed(v);

    // Identify current orbital zone
    const altitude = a - 6371;
    if (altitude < 2000) {
      setZoneName("Low Earth Orbit (LEO)");
    } else if (altitude < 35786) {
      setZoneName("Medium Earth Orbit (MEO)");
    } else if (Math.abs(altitude - 35786) < 500) {
      setZoneName("Geostationary Orbit (GEO)");
    } else {
      setZoneName("Super-synchronous / Graveyard Orbit");
    }
  }, [semiMajorAxis]);

  // Sandbox Canvas Animation
  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radar rings
      ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
      ctx.lineWidth = 0.5;
      for (let r = 20; r < width / 2; r += 20) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Earth visual radius (fixed visual size for reference)
      const earthRadiusVisual = 25;
      
      // Draw Earth
      const earthGrad = ctx.createRadialGradient(centerX - 5, centerY - 5, 5, centerX, centerY, earthRadiusVisual);
      earthGrad.addColorStop(0, "#0ea5e9");
      earthGrad.addColorStop(0.8, "#0369a1");
      earthGrad.addColorStop(1, "#082f49");
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadiusVisual, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Scaled orbit radius on canvas (6371km Earth is 25px)
      const orbitRadiusVisual = (semiMajorAxis / 6371) * earthRadiusVisual;

      // Draw Orbit Pathway
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadiusVisual, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update position angle using real speed factor (slower speed = slower animation)
      angleRef.current += (speed / 7.67) * 0.035;

      // Calculate satellite position
      const satX = centerX + orbitRadiusVisual * Math.cos(angleRef.current);
      const satY = centerY + orbitRadiusVisual * Math.sin(angleRef.current);

      // Draw Satellite
      ctx.fillStyle = "#06b6d4";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#06b6d4";
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw velocity vector arrow pointing prograde (perpendicular to radial line)
      const velocityAngle = angleRef.current + Math.PI / 2;
      const arrowLength = 20;
      const arrowEndX = satX + arrowLength * Math.cos(velocityAngle);
      const arrowEndY = satY + arrowLength * Math.sin(velocityAngle);

      ctx.strokeStyle = "#a855f7"; // purple for velocity vector
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.stroke();

      // Velocity arrowhead
      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(arrowEndX, arrowEndY, 2, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [semiMajorAxis, speed]);

  const topics = {
    orbits: [
      {
        title: "Low Earth Orbit (LEO)",
        description: "Altitudes between 160 and 2,000 km. Most human spaceflight (including the ISS) and modern satellite constellations (like Starlink) operate here. It is also the most congested orbital zone, presenting the highest risk of debris conjunction events.",
        math: "v ≈ 7.8 km/s   |   T ≈ 90 mins",
      },
      {
        title: "Medium Earth Orbit (MEO)",
        description: "Altitudes between 2,000 and 35,786 km. Home to global positioning satellite navigation constellations, including GPS (USA), GLONASS (Russia), Galileo (Europe), and BeiDou (China). The collision risk here is lower, but debris is harder to de-orbit.",
        math: "v ≈ 3.9 km/s   |   T ≈ 12 hours",
      },
      {
        title: "Geostationary Orbit (GEO)",
        description: "Altitudes at exactly 35,786 km. Satellites in GEO match Earth's rotational speed, appearing stationary over a fixed point on the equator. Used for weather tracking and television broadcasts. Inactive satellites are moved to a higher 'graveyard orbit' to mitigate collisions.",
        math: "v ≈ 3.07 km/s   |   T ≈ 24 hours",
      },
    ],
    debris: [
      {
        title: "What is Space Debris?",
        description: "Space debris consists of defunct human-made objects in space — defunct satellites, spent rocket boosters, and fragments from fragmentation events. Currently, there are millions of debris particles in orbit, ranging from discarded paint chips to multi-ton defunct spacecraft.",
        math: "Size ≥ 1 cm  ⟹  Bullet Kinetic Energy",
      },
      {
        title: "Hypervelocity Impact Mechanics",
        description: "In Low Earth Orbit, relative impact speeds average 10 to 15 km/s (36,000 to 54,000 km/h). At these speeds, collisions do not merely dent spacecraft; they release kinetic energy equivalent to explosive fragmentation, turning a single satellite into thousands of new projectiles.",
        math: "E_k = ½ m · v²",
      },
      {
        title: "The Kessler Syndrome",
        description: "First theorized by NASA scientist Donald J. Kessler in 1978, it describes a critical threshold where Low Earth Orbit becomes so dense with debris that one collision triggers a cascade. This self-sustaining chain reaction would create a permanent debris belt, rendering orbital spaces unusable.",
        math: "dN/dt = Sources + Collisions · N² - Sinks",
      },
    ],
    mechanics: [
      {
        title: "Kepler's Third Law (Harmonic Law)",
        description: "The square of a satellite's orbital period (T) is directly proportional to the cube of its semi-major axis (a). In circular orbits, this dictates that the higher the altitude, the slower the satellite must travel to maintain its orbit, and the longer its orbital period.",
        math: "T² ∝ a³  ⟹  T = 2π √(a³ / GM)",
      },
      {
        title: "Orbital Inclination (i)",
        description: "The angle between a satellite's orbital plane and the Earth's equatorial plane. Satellites at 0° orbit directly over the equator. Satellites at 90° (polar orbits) pass over the poles. Polar orbits cross each other frequently, making them critical hubs for collision risk monitoring.",
        math: "0° ≤ i ≤ 180°",
      },
      {
        title: "Eccentricity (e)",
        description: "A dimensionless parameter that defines the shape of the orbit. An eccentricity of 0 represents a perfect circle. An eccentricity between 0 and 1 represents an ellipse. Highly eccentric orbits cross multiple altitudes, posing potential risks to various satellite rings.",
        math: "e = √(1 - b²/a²)   (0 ≤ e < 1)",
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-cyan-400" /> Space Education Center
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            MISSION MANUAL: Undergo technical briefings on orbital mechanics, debris kinetics, and evasive operations.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab("orbits")}
          className={`flex-1 pb-3 text-center text-xs font-orbitron font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "orbits"
              ? "text-cyan-400 border-cyan-500"
              : "text-gray-400 border-transparent hover:text-cyan-300"
          }`}
        >
          <Orbit className="w-4 h-4 mx-auto mb-1 animate-pulse" />
          Orbital Rings
        </button>
        <button
          onClick={() => setActiveTab("debris")}
          className={`flex-1 pb-3 text-center text-xs font-orbitron font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "debris"
              ? "text-cyan-400 border-cyan-500"
              : "text-gray-400 border-transparent hover:text-cyan-300"
          }`}
        >
          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-500" />
          Space Debris
        </button>
        <button
          onClick={() => setActiveTab("mechanics")}
          className={`flex-1 pb-3 text-center text-xs font-orbitron font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "mechanics"
              ? "text-cyan-400 border-cyan-500"
              : "text-gray-400 border-transparent hover:text-cyan-300"
          }`}
        >
          <Globe className="w-4 h-4 mx-auto mb-1 text-purple-400" />
          Orbital Mechanics
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Topics List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {topics[activeTab].map((topic, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl hud-corner flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-orbitron font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> {topic.title}
                </h3>
                <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                  {topic.description}
                </p>
              </div>

              {topic.math && (
                <div className="w-full md:w-60 bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2 font-orbitron">Physical Formula</span>
                  <code className="text-[10px] font-mono text-cyan-400 text-center leading-normal block select-all">
                    {topic.math}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Info Box: Interactive Keplerian Sandbox (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Keplerian Sandbox Visualizer */}
          <div className="glass-panel p-5 rounded-xl hud-corner border border-white/10 flex flex-col gap-4">
            <h3 className="text-xs font-orbitron font-bold text-cyan-400 flex items-center gap-1.5">
              <Orbit className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: "15s" }} /> 
              Keplerian Physics Sandbox
            </h3>
            
            <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
              Drag the radius slider to adjust the satellite's orbital semi-major axis ($a$). Observe how speed ($v$) and orbital period ($T$) adapt according to gravity.
            </p>

            {/* Sandbox Canvas */}
            <div className="w-full h-48 bg-black/40 rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
              <canvas
                ref={sandboxCanvasRef}
                width={280}
                height={192}
                className="w-full h-full block"
              />
              <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400/70 border border-cyan-500/10 bg-cyan-950/20 px-1.5 py-0.5 rounded uppercase">
                {zoneName}
              </div>
            </div>

            {/* Radius Slider Input */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] font-bold font-orbitron uppercase text-gray-400">
                <span>Semi-Major Axis (a)</span>
                <span className="text-cyan-400">{semiMajorAxis.toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min={6700} // LEO minimum (~330km alt)
                max={42200} // GEO maximum (~35800km alt)
                step={200}
                value={semiMajorAxis}
                onChange={(e) => setSemiMajorAxis(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>LEO (~300km alt)</span>
                <span>GEO (~35,800km alt)</span>
              </div>
            </div>

            {/* Physical Outputs Summary */}
            <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 text-xs font-mono">
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <span className="block text-[8px] text-gray-500 uppercase">Calculated Period</span>
                <span className="font-bold text-white text-[11px]">
                  {period >= 120 ? `${(period / 60).toFixed(2)} hours` : `${period.toFixed(1)} minutes`}
                </span>
              </div>
              <div className="p-2 bg-black/30 rounded border border-white/5">
                <span className="block text-[8px] text-gray-500 uppercase">Orbital Velocity</span>
                <span className="font-bold text-purple-300 text-[11px]">{speed.toFixed(2)} km/s</span>
              </div>
            </div>
          </div>

          {/* Avoidance Evasion Protocols Summary */}
          <div className="glass-panel p-5 rounded-xl hud-corner border border-white/5">
            <h3 className="text-xs font-orbitron font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400 animate-pulse" /> Avoidance Maneuver Vectors
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4 font-mono">
              When conjunction calculations verify a <strong>High Risk</strong> state, operations teams command maneuvers:
            </p>
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <strong className="block text-cyan-400 font-bold mb-1 font-orbitron text-[10px]">1. PROGRADE ORBIT BURN</strong>
                Firing thrusters in the direction of flight raises the orbital altitude on the opposite side, delaying arrival time to ensure separation.
              </div>
              <div className="p-3 bg-black/30 rounded border border-white/5">
                <strong className="block text-cyan-400 font-bold mb-1 font-orbitron text-[10px]">2. RETROGRADE BURN</strong>
                Firing thrusters opposite to flight direction lowers altitude and speed, causing the satellite to arrive early at the crossing epoch.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
