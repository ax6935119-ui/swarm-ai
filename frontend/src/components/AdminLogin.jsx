import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronLeft,
} from "react-icons/fa";
import { loginAdmin } from "../services/adminService";

export default function AdminLogin({ onLoginSuccess, onBackToCitizen }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter your administrator username.");
      return;
    }
    if (!password) {
      setError("Please enter your administrator password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loginAdmin(username.trim(), password);
      if (data?.success) {
        onLoginSuccess(data.username || username);
      } else {
        setError(data?.message || "Authentication failed. Access denied.");
      }
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        "Invalid username or password. Please verify your credentials.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link */}
        {onBackToCitizen && (
          <button
            type="button"
            onClick={onBackToCitizen}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-mono uppercase tracking-wider mb-6 cursor-pointer"
          >
            <FaChevronLeft className="text-[10px]" />
            Return to Citizen Portal
          </button>
        )}

        {/* Emblem & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-xl shadow-red-950/60 border border-red-500/30 mb-4">
            <FaShieldAlt className="text-2xl" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Emergency Command Portal
          </h2>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
            Authorized Personnel Only
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-3"
          >
            <FaExclamationTriangle className="text-sm shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaUser className="text-[10px]" /> Administrator ID
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                placeholder="e.g. admin"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaLock className="text-[10px]" /> Security Key / Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                className="w-full px-4 py-3.5 pr-11 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Access Command Center</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
            Restricted access. All connection attempts, IP addresses, and command operations are cryptographically logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
