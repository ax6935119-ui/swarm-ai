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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-sm">

      <div className="px-8 py-5 flex items-center justify-between">

        {/* Left Side */}
        <div className="flex items-center gap-4">

          <div className="
            w-14
            h-14
            rounded-2xl
            bg-gradient-to-br
            from-blue-600
            to-indigo-700
            text-white
            flex
            items-center
            justify-center
            shadow-lg
          ">
            <FaRobot size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              SwarmAI
            </h1>

            <p className="text-sm text-slate-500">
              Multi-Agent Disaster Response Platform
            </p>
          </div>

        </div>

        {/* Right Side */}
        <div className="text-right">

          <p className="text-xs uppercase tracking-wider text-slate-400">
            Current Time
          </p>

          <p className="font-semibold text-slate-800">
            {time.toLocaleTimeString()}
          </p>

          <p className="text-sm text-slate-500">
            {time.toLocaleDateString()}
          </p>

        </div>

      </div>

    </nav>
  );
}