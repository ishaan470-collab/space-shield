"use client";

import React, { useState } from "react";
import { BookOpen, Orbit, Globe, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState<"orbits" | "debris" | "mechanics">("orbits");

  const topics = {
    orbits: [
      {
        title: "Low Earth Orbit (LEO)",
        description: "Altitudes between 160 and 2,000 km. Most human spaceflight (including the ISS) and modern satellite constellations (like Starlink) operate here. It is also the most congested orbital zone, presenting the highest risk of debris conjunction events.",
        math: "v \approx 7.8 \text{ km/s} \quad | \quad T \approx 90 \text{ mins}",
      },
      {
        title: "Medium Earth Orbit (MEO)",
        description: "Altitudes between 2,000 and 35,786 km. Home to global positioning satellite navigation constellations, including GPS (USA), GLONASS (Russia), Galileo (Europe), and BeiDou (China). The collision risk here is lower, but debris is harder to de-orbit.",
        math: "v \approx 3.9 \text{ km/s} \quad | \quad T \approx 12 \text{ hours}",
      },
      {
        title: "Geostationary Orbit (GEO)",
        description: "Altitudes at exactly 35,786 km. Satellites in GEO match Earth's rotational speed, appearing stationary over a fixed point on the equator. Used for weather tracking and television broadcasts. Inactive satellites are moved to a higher 'graveyard orbit' to mitigate collisions.",
        math: "v \approx 3.07 \text{ km/s} \quad | \quad T \approx 24 \text{ hours}",
      },
    ],
    debris: [
      {
        title: "What is Space Debris?",
        description: "Space debris consists of defunct human-made objects in space — defunct satellites, spent rocket boosters, and fragments from fragmentation events. Currently, there are millions of debris particles in orbit, ranging from discarded paint chips to multi-ton defunct spacecraft.",
        math: "Size \ge 1 \text{ cm} \implies \text{Bullet Kinetic Energy}",
      },
      {
        title: "Hypervelocity Impact Mechanics",
        description: "In Low Earth Orbit, relative impact speeds average 10 to 15 km/s (36,000 to 54,000 km/h). At these speeds, collisions do not merely dent spacecraft; they release kinetic energy equivalent to explosive fragmentation, turning a single satellite into thousands of new projectiles.",
        math: "KE = \frac{1}{2} m v^2",
      },
      {
        title: "The Kessler Syndrome",
        description: "First theorized by NASA scientist Donald J. Kessler in 1978, it describes a critical threshold where Low Earth Orbit becomes so dense with debris that one collision triggers a cascade. This self-sustaining chain reaction would create a permanent debris belt, rendering orbital spaces unusable.",
        math: "\frac{dN}{dt} = \text{Sources} + \text{Collisions} \times N^2 - \text{Sinks}",
      },
    ],
    mechanics: [
      {
        title: "Kepler's Third Law",
        description: "The square of a satellite's orbital period (T) is directly proportional to the cube of its semi-major axis (a). In circular orbits, this dictates that the higher the altitude, the slower the satellite must travel to maintain its orbit, and the longer its orbital period.",
        math: "T^2 \propto a^3 \implies T = 2\pi\sqrt{\frac{a^3}{GM}}",
      },
      {
        title: "Orbital Inclination (i)",
        description: "The angle between a satellite's orbital plane and the Earth's equatorial plane. Satellites at 0° orbit directly over the equator. Satellites at 90° (polar orbits) pass over the poles. Polar orbits cross each other frequently, making them critical hubs for collision risk monitoring.",
        math: "0^\circ \le i \le 180^\circ",
      },
      {
        title: "Eccentricity (e)",
        description: "A dimensionless parameter that defines the shape of the orbit. An eccentricity of 0 represents a perfect circle. An eccentricity between 0 and 1 represents an ellipse. Highly eccentric orbits cross multiple altitudes, posing potential risks to various satellite rings.",
        math: "e = \sqrt{1 - \frac{b^2}{a^2}} \quad (0 \le e < 1)",
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-cyan-400" /> Space Education Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Master orbital mechanics, space debris dynamics, and risk prevention models.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/10 max-w-md">
        <button
          onClick={() => setActiveTab("orbits")}
          className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
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
          className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
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
          className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
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
        {/* Left Topics List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {topics[activeTab].map((topic, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> {topic.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2.5 leading-relaxed">
                  {topic.description}
                </p>
              </div>

              {topic.math && (
                <div className="w-full md:w-56 bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Math / Constants</span>
                  <code className="text-xs font-mono text-cyan-400 text-center leading-normal block select-all">
                    {topic.math}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Info Box: Collision Avoidance System (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-xl border border-white/10 bg-gradient-to-b from-gray-950/40 via-slate-900/40 to-cyan-950/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" /> Avoidance Evasion Protocols
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              When a conjunction assessment flag changes to <strong>High Risk</strong>, operators must evaluate evasive actions:
            </p>
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-black/20 rounded border border-white/5">
                <strong className="block text-cyan-300 font-semibold mb-0.5">1. DAM (Debris Avoidance Maneuver)</strong>
                Using chemical thrusters, the satellite burns propellant to raise or lower its orbit slightly, altering the arrival epoch to ensure safety clearance.
              </div>
              <div className="p-3 bg-black/20 rounded border border-white/5">
                <strong className="block text-cyan-300 font-semibold mb-0.5">2. Differential Drag</strong>
                For satellites without active propulsive thrusters, altering their cross-sectional attitude changes aerodynamic drag, modifying the orbital period over weeks.
              </div>
              <div className="p-3 bg-black/20 rounded border border-white/5">
                <strong className="block text-cyan-300 font-semibold mb-0.5">3. Active Debris Removal (ADR)</strong>
                Emerging technology missions utilizing harpoons, nets, or magnetic arms to capture defunct space hulls and force reentry into Earth's atmosphere.
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/5 text-center flex flex-col items-center gap-2">
            <HelpCircle className="w-7 h-7 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Test Your Telemetry</h4>
            <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
              Use the Predictor to simulate physical variables. See how reducing distance to &lt; 1km spikes collision classification probability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
