import { FaRobot } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function Navbar() {
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
        <div className="flex items-center gap-3.5">

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
            <h1 className="text-xl font-bold text-white tracking-tight">
              SwarmAI
            </h1>

            <p className="text-xs text-slate-400">
              Autonomous Disaster Decision Intelligence
            </p>
          </div>

        </div>

        {/* Right Side */}
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

    </nav>
  );
}