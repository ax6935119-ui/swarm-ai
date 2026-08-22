/**
 * NotificationPanel — lets admins select responder teams
 * and dispatch alerts for a given incident.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHistory,
  FaPaperPlane,
} from "react-icons/fa";
import { sendNotification, getNotifications } from "../services/adminService";

const RESPONDERS = [
  { code: "sos",       label: "SOS Contacts",       icon: "🆘", color: "border-red-700 bg-red-950/30" },
  { code: "fire",      label: "Fire Brigade",        icon: "🚒", color: "border-orange-700 bg-orange-950/30" },
  { code: "police",    label: "Police",              icon: "🚔", color: "border-blue-700 bg-blue-950/30" },
  { code: "hospital",  label: "Hospital",            icon: "🏥", color: "border-emerald-700 bg-emerald-950/30" },
  { code: "ambulance", label: "Ambulance Services",  icon: "🚑", color: "border-cyan-700 bg-cyan-950/30" },
];

export default function NotificationPanel({ incident }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // success | error
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load notification history
  useEffect(() => {
    if (!incident?.id) return;

    setHistoryLoading(true);

    getNotifications(incident.id)
      .then((data) => setHistory(data.notifications || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [incident?.id, result]);

  const toggle = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSend = async () => {
    if (!selected.length) return;

    setSending(true);
    setResult(null);

    try {
      await sendNotification({
        incidentId: incident.id,
        recipients: selected,
        message: message.trim(),
      });

      setResult({ type: "success", text: `Alert dispatched to ${selected.length} team(s).` });
      setSelected([]);
      setMessage("");
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        "Failed to send notification. Check backend connection.";
      setResult({ type: "error", text: typeof detail === "string" ? detail : JSON.stringify(detail) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <FaBell className="text-amber-400" />
        <h3 className="text-base font-bold text-white tracking-tight">
          Notification Center
        </h3>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          Incident #{incident?.short_id}
        </span>
      </div>

      {/* Responder Grid */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-3">
          Select Recipients
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESPONDERS.map(({ code, label, icon, color }) => {
            const active = selected.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? `${color} border-opacity-100 ring-1 ring-inset ring-white/10`
                    : "border-slate-800 bg-slate-900/50 hover:bg-slate-800"
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold text-slate-200">
                  {label}
                </span>
                {active && (
                  <FaCheckCircle className="ml-auto text-emerald-400 text-sm shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Message */}
      <div>
        <label className="text-xs uppercase tracking-wider text-slate-400 font-mono block mb-2">
          Custom Message (optional)
        </label>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Emergency alert for Zone A — immediate response required."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
      </div>

      {/* Result Banner */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            result.type === "success"
              ? "bg-emerald-950/50 border-emerald-700 text-emerald-300"
              : "bg-red-950/50 border-red-700 text-red-300"
          }`}
        >
          {result.type === "success" ? (
            <FaCheckCircle className="shrink-0" />
          ) : (
            <FaExclamationTriangle className="shrink-0" />
          )}
          {result.text}
        </motion.div>
      )}

      {/* Send Button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!selected.length || sending}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
          selected.length && !sending
            ? "bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg shadow-red-950/40"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {sending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Dispatching…
          </>
        ) : (
          <>
            <FaPaperPlane className="text-xs" />
            Dispatch Alert
            {selected.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-800 text-xs">
                {selected.length}
              </span>
            )}
          </>
        )}
      </button>

      {/* Notification History */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <FaHistory className="text-slate-500 text-xs" />
            <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">
              Dispatch History
            </p>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((n, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-300 font-medium truncate">
                    {(n.recipients || []).map((r) => r.label).join(", ")}
                  </p>
                  <p className="text-slate-500 mt-0.5 font-mono">
                    {new Date(n.dispatched_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
