"use client";

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, RefreshCw, Layers } from "lucide-react";

interface OrbitalSimulationProps {
  altitude: number;
  velocity: number;
  inclination: number;
  relativeDistance: number;
  relativeVelocity: number;
  risk: string;
  evasionActive?: boolean;
  evasionBurnDeltaV?: number;
}

export default function OrbitalSimulation({
  altitude,
  velocity,
  inclination,
  relativeDistance,
  relativeVelocity,
  risk,
  evasionActive = false,
  evasionBurnDeltaV = 0,
}: OrbitalSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // Animation ticks/angles
  const satAngleRef = useRef(0);
  const debrisAngleRef = useRef(Math.PI);
  const earthRotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Centered coordinate space
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw Space Radar grid background if enabled
      if (showMesh) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
        ctx.lineWidth = 0.8;
        
        // Circular radar rings
        for (let r = 50; r <= Math.max(width, height); r += 50) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, r * zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radar cross lines
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();
      }

      // Physics scaled mappings
      // Base Earth radius is 6371km. Let's represent Earth radius as 40px.
      const earthRadiusVisual = 42 * zoom;
      // Map altitude (150km to 2000km) to visual radius
      const satOrbitRadiusVisual = earthRadiusVisual + (15 + (altitude / 2000) * 65) * zoom;
      
      // Map debris distance (0km to 40km) to separation distance
      const baseDebrisOffset = satOrbitRadiusVisual;
      // Convert km to a small offset on screen. If 0.1km, they are practically on top of each other.
      const separationVisual = (relativeDistance / 40) * 35 * zoom;

      // Update simulation angles if playing
      if (isPlaying) {
        // Satellite angular speed scales with velocity
        satAngleRef.current += (velocity / 8) * 0.015;
        // Debris crosses path at standard rate
        debrisAngleRef.current += 0.012;
        // Earth spins slowly
        earthRotationRef.current += 0.002;
      }

      // 2. Draw Earth (Rotating Mesh and Glow)
      ctx.save();
      ctx.translate(centerX, centerY);

      // Glowing Atmosphere
      const atmosphereGlow = ctx.createRadialGradient(0, 0, earthRadiusVisual * 0.9, 0, 0, earthRadiusVisual * 1.35);
      atmosphereGlow.addColorStop(0, "rgba(6, 182, 212, 0.15)");
      atmosphereGlow.addColorStop(0.6, "rgba(6, 182, 212, 0.05)");
      atmosphereGlow.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = atmosphereGlow;
      ctx.beginPath();
      ctx.arc(0, 0, earthRadiusVisual * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Earth body gradient
      const earthGrad = ctx.createRadialGradient(-10, -10, earthRadiusVisual * 0.2, 0, 0, earthRadiusVisual);
      earthGrad.addColorStop(0, "#0e3a60");
      earthGrad.addColorStop(0.6, "#05182b");
      earthGrad.addColorStop(1, "#020811");
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(0, 0, earthRadiusVisual, 0, Math.PI * 2);
      ctx.fill();

      // Earth Outline
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, earthRadiusVisual, 0, Math.PI * 2);
      ctx.stroke();

      // Earth latitude/longitude wireframe revolving
      ctx.rotate(earthRotationRef.current);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
      ctx.lineWidth = 0.5;
      
      // Lon lines (ellipses)
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, earthRadiusVisual, earthRadiusVisual * Math.abs(Math.sin((i * Math.PI) / 4)), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Lat lines
      for (let y = -3; y <= 3; y++) {
        const r = earthRadiusVisual * Math.cos((y * Math.PI) / 8);
        const yOffset = earthRadiusVisual * Math.sin((y * Math.PI) / 8);
        ctx.beginPath();
        ctx.arc(0, yOffset, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // 3. Draw Satellite Orbit
      ctx.save();
      ctx.translate(centerX, centerY);
      // Inclination tilts the orbit plane visual representation on the 2D canvas
      // Convert inclination (0-180deg) to 2D skew rotation/scaling
      const incRad = (inclination * Math.PI) / 180;
      ctx.rotate(incRad * 0.4); // tilt orbit slightly based on inclination
      
      // Orbit color based on risk status
      let orbitColor = "rgba(16, 185, 129, 0.25)"; // safe green
      if (risk === "High Risk" && !evasionActive) {
        orbitColor = "rgba(239, 68, 68, 0.4)";
      } else if (risk === "Medium Risk" && !evasionActive) {
        orbitColor = "rgba(245, 158, 11, 0.35)";
      }
      
      ctx.strokeStyle = orbitColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      // Draw ellipse representing inclined orbit plane from isometric perspective
      ctx.ellipse(0, 0, satOrbitRadiusVisual, satOrbitRadiusVisual * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
      ctx.restore();

      // 4. Calculate Satellite Position
      // For visual coordinates, map the inclined ellipse to x,y
      const satX = centerX + satOrbitRadiusVisual * Math.cos(satAngleRef.current);
      const satY = centerY + satOrbitRadiusVisual * 0.65 * Math.sin(satAngleRef.current) - (inclination / 180) * 15 * zoom;

      // 5. Draw Evasive Orbit (If evasion solver is activated)
      if (evasionActive) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(incRad * 0.4);
        
        // Raised orbit radius visual representation
        const evasiveRadiusOffset = satOrbitRadiusVisual + 12 * zoom;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)"; // Evasive blue
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, evasiveRadiusOffset, evasiveRadiusOffset * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Evasive path trajectory line from current satellite
        ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        const nextSatX = centerX + (satOrbitRadiusVisual + 12 * zoom) * Math.cos(satAngleRef.current + 0.5);
        const nextSatY = centerY + (satOrbitRadiusVisual + 12 * zoom) * 0.65 * Math.sin(satAngleRef.current + 0.5) - (inclination / 180) * 15 * zoom;
        ctx.lineTo(nextSatX, nextSatY);
        ctx.stroke();
      }

      // 6. Draw Debris Orbit (Crossing at different inclination angle)
      ctx.save();
      ctx.translate(centerX, centerY);
      // Debris orbits in opposite inclination direction to simulate collision vector
      ctx.rotate(-incRad * 0.25 - 0.5);
      ctx.strokeStyle = evasionActive ? "rgba(100, 116, 139, 0.15)" : "rgba(239, 68, 68, 0.18)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, baseDebrisOffset, baseDebrisOffset * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 7. Calculate Debris Position
      // To simulate an active close-approach crossing point, the debris meets the satellite's
      // orbit vector at a specific crossing phase. Let's calculate the debris position
      // such that it matches the closest approach offset based on relative distance parameter.
      
      // Let the debris intersect near the satellite, offset by relativeDistance
      // Calculate intersection angle close to satellite's current position
      const collisionAngleOffset = 0.15; // fixed crossing delta
      const debrisX = centerX + (satOrbitRadiusVisual + separationVisual) * Math.cos(satAngleRef.current + collisionAngleOffset);
      const debrisY = centerY + (satOrbitRadiusVisual + separationVisual) * 0.65 * Math.sin(satAngleRef.current + collisionAngleOffset) - (inclination / 180) * 15 * zoom;

      // 8. Draw Closest Approach Warning Vector Line
      ctx.save();
      ctx.lineWidth = 1;
      if (relativeDistance < 2.0 && !evasionActive) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.75)"; // solid red
        ctx.setLineDash([2, 2]);
        // Flashing red zone surrounding intersection
        ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
        ctx.beginPath();
        ctx.arc(satX, satY, 18 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.stroke();
      } else if (relativeDistance < 5.0 && !evasionActive) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)"; // amber
        ctx.setLineDash([3, 3]);
      } else {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)"; // cyan safe line
        ctx.setLineDash([4, 4]);
      }

      // Draw vector connector line
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(debrisX, debrisY);
      ctx.stroke();
      ctx.restore();

      // 9. Draw Satellite Node
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = evasionActive ? "#06b6d4" : risk === "High Risk" ? "#ef4444" : risk === "Medium Risk" ? "#f59e0b" : "#10b981";
      
      ctx.fillStyle = evasionActive ? "#06b6d4" : risk === "High Risk" ? "#ef4444" : risk === "Medium Risk" ? "#f59e0b" : "#10b981";
      ctx.beginPath();
      ctx.arc(satX, satY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Orbit pulsing beacon ring
      if (isPlaying) {
        const pulseRadius = 5 + (Date.now() % 1000) / 100 * 1.5;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(satX, satY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 10. Draw Debris Node
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ef4444";
      ctx.fillStyle = "#ef4444";
      // Draw debris as small square fragment
      ctx.translate(debrisX, debrisY);
      ctx.rotate(debrisAngleRef.current * 2);
      ctx.fillRect(-2.5, -2.5, 5, 5);
      ctx.restore();

      // 11. Text Annotations HUD overlays
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      
      // Satellite identifier label
      ctx.fillText("TARGET_ASSET", satX + 8, satY - 4);
      ctx.fillStyle = "#fff";
      ctx.fillText(evasionActive ? "EVASIVE_ATTITUDE" : "ACTIVE_OPERATIONAL", satX + 8, satY + 5);

      // Debris label
      ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
      ctx.fillText("DEBRIS_HAZARD", debrisX + 8, debrisY - 4);
      ctx.fillText(`RANGE: ${relativeDistance.toFixed(2)} KM`, debrisX + 8, debrisY + 5);

      // Telemetry HUD overlay details in top-left
      ctx.save();
      ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
      ctx.font = "9px 'Orbitron', sans-serif";
      ctx.fillText("TELEMETRY SENSOR GRID v1.0", 12, 20);
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillText(`ALTITUDE: ${altitude.toFixed(0)} KM`, 12, 32);
      ctx.fillText(`VELOCITY: ${velocity.toFixed(2)} KM/S`, 12, 42);
      ctx.fillText(`INCLINATION: ${inclination.toFixed(2)}°`, 12, 52);
      
      // Evasion telemetry flag
      if (evasionActive) {
        ctx.fillStyle = "#06b6d4";
        ctx.fillText(`EVASION MANEUVER ACTIVE`, 12, 65);
        ctx.fillText(`BURN DELTA-V: ${evasionBurnDeltaV.toFixed(2)} M/S`, 12, 75);
      } else {
        ctx.fillStyle = risk === "High Risk" ? "#ef4444" : risk === "Medium Risk" ? "#f59e0b" : "#10b981";
        ctx.fillText(`THREAT RISK STATUS: ${risk.toUpperCase()}`, 12, 65);
      }
      ctx.restore();

      // Bottom Right: Vector Scale Box
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(width - 70, height - 15);
      ctx.lineTo(width - 20, height - 15);
      ctx.moveTo(width - 70, height - 18);
      ctx.lineTo(width - 70, height - 12);
      ctx.moveTo(width - 20, height - 18);
      ctx.lineTo(width - 20, height - 12);
      ctx.stroke();

      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillText("VISUAL SCALE", width - 68, height - 20);
      
      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [altitude, velocity, inclination, relativeDistance, relativeVelocity, risk, isPlaying, showMesh, zoom, evasionActive, evasionBurnDeltaV]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full cyber-hologram border border-white/5 shadow-2xl">
      {/* HUD Header Bar */}
      <div className="bg-black/40 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping shrink-0" />
          <span className="font-orbitron font-semibold text-[10px] tracking-wider uppercase text-cyan-400">
            Orbital Proximity Visualizer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 mr-2 uppercase">Sensor Status:</span>
          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] font-orbitron ${
            evasionActive 
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
              : risk === "High Risk" 
              ? "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse" 
              : risk === "Medium Risk"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              : "bg-green-500/15 text-green-400 border border-green-500/20"
          }`}>
            {evasionActive ? "EVADING" : risk === "High Risk" ? "DANGER" : risk === "Medium Risk" ? "WARNING" : "SAFE"}
          </span>
        </div>
      </div>

      {/* Simulator Canvas Frame */}
      <div className="relative flex-grow min-h-[300px] md:min-h-[340px] bg-black/60 overflow-hidden">
        {/* CRT Scanline effect wrapper */}
        <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-10" />

        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Dynamic Warning Indicator Overlay */}
        {risk === "High Risk" && !evasionActive && (
          <div className="absolute bottom-4 left-4 p-2.5 rounded-lg border border-red-500/30 bg-red-950/40 text-red-300 font-mono text-[9px] uppercase tracking-wider animate-pulse flex flex-col gap-0.5 pointer-events-none z-20">
            <span className="font-bold text-red-400">⚠️ PROXIMITY ALERT ⚠️</span>
            <span>CRITICAL COLLISION VECTOR</span>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="bg-black/30 border-t border-white/5 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 text-gray-300 hover:text-cyan-400 transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Stop Sim
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Start Sim
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded border transition-all font-bold tracking-widest uppercase text-[10px] ${
              showMesh 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Grid Mesh
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase font-bold">
            <span>Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-800 rounded appearance-none accent-cyan-500 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 text-[9px] w-6 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
