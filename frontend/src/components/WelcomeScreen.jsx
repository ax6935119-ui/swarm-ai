import React from "react";
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
      y: -12,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 14,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7F9] text-[#172033] flex flex-col justify-between p-3 sm:p-5 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft neutral atmosphere */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#E8EDF3] opacity-45 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full bg-[#EEF1F4] opacity-65 blur-3xl" />

        {/* Subtle map contour */}
        <div className="absolute inset-0 opacity-[0.10]">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
          >
            <path
              d="M0 180 C180 80 300 250 470 150 S760 80 920 190 S1080 270 1200 150"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            <path
              d="M0 620 C180 520 300 690 470 590 S760 520 920 630 S1080 710 1200 590"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* Main Layout */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 flex-1 min-h-0"
      >
        {/* LEFT SIDE — TEXT */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          {/* Logo */}
          <motion.div
            variants={itemVariants}
            className="mb-5 flex items-center justify-center lg:justify-start"
          >
            <motion.img
              src="/src/assets/logo.png"
              alt="SwarmAI"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold text-[#111827] tracking-tight leading-none"
          >
            SwarmAI
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl font-medium text-[#334155] tracking-wide mt-4"
          >
            Autonomous Disaster Decision Intelligence
          </motion.p>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl mt-6"
          >
            SwarmAI analyzes disaster events, combines coordinated AI
            decision-making with historical disaster memory, and produces
            actionable emergency response recommendations.
          </motion.p>

          {/* Capability Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8 text-left"
          >
            {/* Assessment */}
            <div className="bg-white/95 border border-[#D5DAE1] rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-fit p-2.5 rounded-lg bg-[#FBEAEA] text-[#B42318]">
                <FaShieldAlt className="text-sm" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#334155]">
                  Assessment
                </p>
                <p className="text-xs text-[#526174] mt-1 leading-relaxed">
                  Visual & impact analysis
                </p>
              </div>
            </div>

            {/* Response Plan */}
            <div className="bg-white/95 border border-[#D5DAE1] rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-fit p-2.5 rounded-lg bg-[#EAF1F5] text-[#3F647D]">
                <FaRoute className="text-sm" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#334155]">
                  Response Plan
                </p>
                <p className="text-xs text-[#526174] mt-1 leading-relaxed">
                  Routing & resources
                </p>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-white/95 border border-[#D5DAE1] rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="w-fit p-2.5 rounded-lg bg-[#F2F3F5] text-[#596575]">
                <FaDatabase className="text-sm" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#334155]">
                  Memory
                </p>
                <p className="text-xs text-[#526174] mt-1 leading-relaxed">
                  Historical correlation
                </p>
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
        </div>
      </motion.main>
    </div>
  );
}