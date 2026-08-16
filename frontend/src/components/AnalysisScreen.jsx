import { motion, useReducedMotion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaShieldAlt,
  FaSearch,
  FaChartLine,
  FaHistory,
  FaClipboardList,
  FaSpinner,
} from "react-icons/fa";

export default function AnalysisScreen({ location = "" }) {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      id: 1,
      title: "Analyzing incident",
      desc: "Evaluating photographic evidence, damage patterns, and visual severity indicators.",
      icon: <FaSearch className="text-red-400 text-sm" />,
    },
    {
      id: 2,
      title: "Assessing impact",
      desc: "Estimating evacuation necessity, casualty impact, and transport disruption.",
      icon: <FaChartLine className="text-amber-400 text-sm" />,
    },
    {
      id: 3,
      title: "Reviewing historical incidents",
      desc: "Correlating situational data against past disaster precedents in memory.",
      icon: <FaHistory className="text-cyan-400 text-sm" />,
    },
    {
      id: 4,
      title: "Preparing response",
      desc: "Synthesizing actionable emergency guidance, optimal routing, and medical readiness.",
      icon: <FaClipboardList className="text-emerald-400 text-sm" />,
    },
  ];

  const pulseAnimation = shouldReduceMotion
    ? {}
    : {
        scale: [1, 1.08, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      };

  const ringAnimation = shouldReduceMotion
    ? {}
    : {
        scale: [1, 1.4, 1],
        opacity: [0.4, 0, 0.4],
        transition: {
          duration: 2.2,
          repeat: Infinity,
          ease: "easeOut",
        },
      };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Top Processing Emblem & Location */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />

        {/* Central Pulse Indicator */}
        <div className="relative flex items-center justify-center my-4">
          <motion.div
            animate={ringAnimation}
            className="absolute w-20 h-20 rounded-full border border-red-500/40"
          />
          <motion.div
            animate={pulseAnimation}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-xl shadow-red-950/80 border border-red-500/40 z-10"
          >
            <FaShieldAlt className="text-2xl" />
          </motion.div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-6">
          SwarmAI Decision Intelligence in Progress
        </h2>

        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Coordinating multi-modal analysis, disaster memory correlation, and emergency response planning.
        </p>

        {/* Incident Target Badge */}
        {location && (
          <div className="inline-flex items-center gap-2 px-4 py-2 mt-5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono">
            <FaMapMarkerAlt className="text-red-500" />
            <span className="text-slate-400">Target Location:</span>
            <span className="text-white font-semibold">{location}</span>
          </div>
        )}
      </div>

      {/* Analysis Stages Overview */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 mt-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin text-red-500 text-sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Analysis Workflow
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Live Execution
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 font-semibold">
                    0{step.id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-200 truncate">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Analysis is processing on the backend. Your actionable disaster response will load automatically upon completion.
          </p>
        </div>
      </div>
    </div>
  );
}
