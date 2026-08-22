/**
 * ConflictModal — displays conflict check results and lets the admin
 * choose to Modify, Override (medium severity only), or Cancel.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  FaExclamationTriangle,
  FaTimesCircle,
  FaCheckCircle,
  FaClock,
  FaCar,
  FaUsers,
  FaBolt,
} from "react-icons/fa";

const TYPE_CONFIG = {
  schedule: {
    icon: FaClock,
    color: "text-red-400",
    bg: "bg-red-950/50 border-red-800",
    label: "Schedule Conflict",
  },
  resource: {
    icon: FaCar,
    color: "text-orange-400",
    bg: "bg-orange-950/50 border-orange-800",
    label: "Resource Conflict",
  },
  duplicate: {
    icon: FaBolt,
    color: "text-amber-400",
    bg: "bg-amber-950/50 border-amber-800",
    label: "Duplicate Assignment",
  },
  capacity: {
    icon: FaUsers,
    color: "text-yellow-400",
    bg: "bg-yellow-950/50 border-yellow-800",
    label: "Capacity Warning",
  },
};

export default function ConflictModal({
  conflictResult,
  onModify,
  onOverride,
  onCancel,
}) {
  if (!conflictResult) return null;

  const { hasConflict, severity, conflicts = [] } = conflictResult;
  const isHigh = severity === "high";
  const isMedium = severity === "medium";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div
            className={`px-6 py-5 border-b ${
              isHigh
                ? "border-red-800 bg-red-950/40"
                : isMedium
                ? "border-amber-800 bg-amber-950/30"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isHigh
                    ? "bg-red-900/60 text-red-400"
                    : isMedium
                    ? "bg-amber-900/60 text-amber-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <FaExclamationTriangle className="text-lg" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg tracking-tight">
                  {hasConflict ? "Conflict Detected" : "Conflict Check Passed"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                  Severity:{" "}
                  <span
                    className={
                      isHigh
                        ? "text-red-400"
                        : isMedium
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    {severity}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Conflict List */}
          <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
            {!hasConflict && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                <FaCheckCircle className="text-lg shrink-0" />
                <p className="text-sm font-medium">
                  No conflicts detected. You can safely confirm the delegation.
                </p>
              </div>
            )}

            {conflicts.map((conflict, idx) => {
              const cfg =
                TYPE_CONFIG[conflict.type] || TYPE_CONFIG.capacity;
              const Icon = cfg.icon;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${cfg.bg} space-y-2`}
                >
                  <div className={`flex items-center gap-2 ${cfg.color} text-xs font-bold uppercase tracking-wider`}>
                    <Icon />
                    <span>{cfg.label}</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    {conflict.message}
                  </p>

                  {/* Time detail for schedule conflicts */}
                  {conflict.detail?.existingStart && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-900/60 rounded-lg p-2 text-xs">
                        <p className="text-slate-500 uppercase tracking-wider mb-1">
                          Existing
                        </p>
                        <p className="text-slate-200 font-mono">
                          {new Date(
                            conflict.detail.existingStart
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" → "}
                          {new Date(
                            conflict.detail.existingEnd
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-2 text-xs">
                        <p className="text-slate-500 uppercase tracking-wider mb-1">
                          Requested
                        </p>
                        <p className="text-slate-200 font-mono">
                          {new Date(
                            conflict.detail.requestedStart
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" → "}
                          {new Date(
                            conflict.detail.requestedEnd
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {conflict.detail.overlapHours > 0 && (
                        <div className="col-span-2 text-xs text-red-300 font-mono">
                          Overlap: {conflict.detail.overlapHours}h
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestion */}
                  {conflict.suggestion && (
                    <div className="pt-1 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400">
                        <span className="text-emerald-400 font-semibold">
                          Suggestion:{" "}
                        </span>
                        {conflict.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <FaTimesCircle className="text-xs text-slate-400" />
              Cancel
            </button>

            {hasConflict && (
              <button
                type="button"
                onClick={onModify}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold transition cursor-pointer"
              >
                Modify Assignment
              </button>
            )}

            {/* Override only available for non-high or when user explicitly wants to proceed */}
            {hasConflict && !isHigh && (
              <button
                type="button"
                onClick={onOverride}
                className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold transition cursor-pointer"
              >
                Override & Confirm
              </button>
            )}

            {hasConflict && isHigh && (
              <button
                type="button"
                onClick={onOverride}
                className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer border border-red-600"
                title="Force override — high severity conflicts will be logged"
              >
                Force Override
              </button>
            )}

            {!hasConflict && (
              <button
                type="button"
                onClick={onOverride}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition cursor-pointer"
              >
                Confirm Delegation
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
