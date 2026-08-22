import { FaRobot, FaUserShield, FaSignOutAlt } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function Navbar({ isAdminAuthenticated = false, onLogout = null, onHome = null }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 border-b border-slate-800 shadow-sm">
      <div className="px-6 sm:px-8 py-4 flex items-center justify-between">
        {/* Left Side */}
        <div
          onClick={onHome}
          className={`flex items-center gap-3.5 ${onHome ? "cursor-pointer group" : ""}`}
        >
          <div className="
            w-11
            h-11
            rounded-xl
            bg-gradient-to-br
            from-red-600
            to-red-800
            text-white
            flex
            items-center
            justify-center
            shadow-md
            shadow-red-950/40
            border
            border-red-500/30
          ">
            <FaRobot size={20} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-red-400 transition">
              SwarmAI
            </h1>

            <p className="text-xs text-slate-400">
              Autonomous Disaster Decision Intelligence
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Admin Logged-In Controls (Hidden from regular citizens) */}
          {isAdminAuthenticated && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-mono font-bold">
                <FaUserShield className="text-xs text-red-400" />
                COMMAND
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Log out of Admin Command Center"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/80 hover:text-red-300 border border-slate-700 text-slate-400 text-xs font-semibold transition cursor-pointer"
                >
                  <FaSignOutAlt className="text-xs" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          )}

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              System Time
            </p>

            <p className="text-sm font-semibold text-slate-200 font-mono">
              {time.toLocaleTimeString()}
            </p>

            <p className="text-xs text-slate-500 font-mono">
              {time.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}