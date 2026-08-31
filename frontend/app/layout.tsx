import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "SpaceShield | Satellite Collision Risk Prediction Platform",
  description: "Space situational awareness and collision risk prediction using orbital mechanics and live telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#02040a] text-gray-100 antialiased font-sans relative cyber-grid">
        {/* Starry deep space background overlay */}
        <div className="stars-overlay fixed inset-0 z-0 pointer-events-none" />
        
        {/* Fine cyber-grid background layer */}
        <div className="cyber-grid-cyan fixed inset-0 z-0 opacity-40 pointer-events-none" />

        {/* Dynamic Client Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-grow flex flex-col relative z-10 w-full">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="glass-panel border-t border-white/10 py-6 relative z-10 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono">
              &copy; {new Date().getFullYear()} SpaceShield Operations. All rights reserved.
            </span>
            <div className="flex gap-4">
              <a href="https://celestrak.org" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                CelesTrak Telemetry
              </a>
              <span className="text-white/10">|</span>
              <span className="text-cyan-500/80 font-semibold uppercase tracking-widest text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/20">
                Keplerian Physics Engine v1.0
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
