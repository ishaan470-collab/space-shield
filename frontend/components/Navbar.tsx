"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, Compass, History, BookOpen, LogOut, User, Menu, X, KeyRound } from "lucide-react";
import { apiService, removeToken, getToken } from "../services/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    
    // Add event listener to listen for login actions elsewhere
    const handleAuthChange = () => fetchUser();
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await apiService.getMe();
      setUser(data);
    } catch {
      setUser(null);
      removeToken();
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    window.dispatchEvent(new Event("auth_change"));
    router.push("/");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!authName.trim()) throw new Error("Name is required");
        await apiService.register(authName, authEmail, authPassword);
        setAuthSuccess("Registration successful! Logging you in...");
        // Auto-login after registration
        await apiService.login(authEmail, authPassword);
      } else {
        await apiService.login(authEmail, authPassword);
      }
      
      // Dispatch event to refresh state everywhere
      window.dispatchEvent(new Event("auth_change"));
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setShowAuthModal(false);
      
      // Redirect to predict after login
      router.push("/predict");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { name: "Predictor", href: "/predict", icon: Compass },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
    { name: "Education", href: "/education", icon: BookOpen },
  ];

  return (
    <>
      <nav className="glass-panel sticky top-0 z-50 w-full border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-wide">
              SpaceShield<span className="text-white text-xs ml-1 font-semibold border border-cyan-500/30 px-1.5 py-0.5 rounded-full uppercase">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                      : "text-gray-300 hover:text-cyan-400 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Actions / User Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-200">{user.name}</span>
                  <span className="text-xs text-cyan-400 font-mono">Operator</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/5 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold uppercase shadow shadow-cyan-500/10">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all"
                  title="Logout Operator"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegister(false);
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-md hover:shadow-cyan-500/25 text-white transition-all transform active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                Connect Operator
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <button
                onClick={() => {
                  setIsRegister(false);
                  setShowAuthModal(true);
                }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-500 text-white"
              >
                Connect
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel fixed top-[65px] left-0 w-full z-40 border-b border-white/10 py-4 flex flex-col gap-2 px-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-md text-base font-semibold ${
                  isActive
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-gray-300 hover:text-cyan-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          {user && (
            <div className="border-t border-white/10 mt-2 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">{user.name}</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1 text-sm font-semibold text-red-400 p-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel-glow w-full max-w-md p-6 sm:p-8 rounded-xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
              {isRegister ? "Register Space Operator" : "Operator Authentication"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {isRegister 
                ? "Create a credentials profile to sync satellite telemetry and collision logs." 
                : "Authorize to load and log orbital predictions."}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-md bg-red-950/30 border border-red-500/40 text-red-300 text-sm">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-3 rounded-md bg-green-950/30 border border-green-500/40 text-green-300 text-sm">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Operator Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                    placeholder="e.g. Flight Officer Alex"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Operator Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                  placeholder="name@agency.gov"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Access Key (Password)</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-md bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? "Decrypting..." : isRegister ? "Initiate Profile" : "Authorize Space Mission"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <button
                onClick={() => {
                  setAuthError("");
                  setIsRegister(!isRegister);
                }}
                className="text-xs text-cyan-400 hover:underline hover:text-cyan-300 font-semibold"
              >
                {isRegister ? "Already an operator? Log In" : "Need operator credentials? Register Here"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
