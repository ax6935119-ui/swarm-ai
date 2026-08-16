import { motion } from "framer-motion";
import { FaArrowRight, FaShieldAlt, FaRoute, FaDatabase } from "react-icons/fa";

export default function WelcomeScreen({ onBegin }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -16,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Top subtle system indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl mx-auto flex items-center justify-between border-b border-slate-800/80 pb-4 text-xs font-mono text-slate-500 uppercase tracking-widest"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>SwarmAI Core</span>
        </div>
        <div>Emergency Decision Intelligence</div>
      </motion.div>

      {/* Main Center Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center text-center py-12"
      >
        {/* Emblem / Badge */}
        <motion.div
          variants={itemVariants}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-xl shadow-red-950/60 border border-red-500/30 mb-8"
        >
          <FaShieldAlt className="text-2xl" />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none"
        >
          SwarmAI
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl font-medium text-slate-400 tracking-wide mt-4"
        >
          Autonomous Disaster Decision Intelligence
        </motion.p>

        {/* Explanation */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mt-8 font-normal"
        >
          SwarmAI analyzes disaster events, combines coordinated AI decision-making with historical disaster memory, and produces actionable emergency response recommendations.
        </motion.p>

        {/* Value Pillars (Subtle and Compact) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-10 pt-8 border-t border-slate-800/80 text-left"
        >
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-red-400 mt-0.5">
              <FaShieldAlt className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assessment</p>
              <p className="text-xs text-slate-300 mt-1">Multi-modal visual & impact analysis</p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 mt-0.5">
              <FaRoute className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Response Plan</p>
              <p className="text-xs text-slate-300 mt-1">Evacuation, routing & resources</p>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-amber-400 mt-0.5">
              <FaDatabase className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Memory</p>
              <p className="text-xs text-slate-300 mt-1">Historical precedent correlation</p>
            </div>
          </div>
        </motion.div>

        {/* Primary BEGIN Action */}
        <motion.div variants={itemVariants} className="mt-10">
          <motion.button
            type="button"
            onClick={onBegin}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/60 transition-colors duration-200 flex items-center gap-3 text-base tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <span>BEGIN</span>
            <FaArrowRight className="text-sm" />
          </motion.button>
        </motion.div>
      </motion.main>

      {/* Subtle Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full max-w-5xl mx-auto text-center border-t border-slate-800/80 pt-4 text-xs text-slate-600 font-mono"
      >
        Emergency Command & Incident Intelligence Platform
      </motion.footer>
    </div>
  );
}
