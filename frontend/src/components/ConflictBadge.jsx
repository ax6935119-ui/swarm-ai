/**
 * ConflictBadge — small inline status indicator shown next to
 * team / vehicle selectors and the delegation form header.
 */

export default function ConflictBadge({ status }) {
  // status: "none" | "checking" | "clear" | "warning" | "blocked"

  const cfg = {
    none: {
      cls: "bg-slate-800 text-slate-400 border-slate-700",
      dot: "bg-slate-500",
      label: "Not Checked",
    },
    checking: {
      cls: "bg-blue-950/60 text-blue-300 border-blue-800",
      dot: "bg-blue-400 animate-pulse",
      label: "Checking…",
    },
    clear: {
      cls: "bg-emerald-950/60 text-emerald-300 border-emerald-700",
      dot: "bg-emerald-400",
      label: "No Conflicts",
    },
    warning: {
      cls: "bg-amber-950/60 text-amber-300 border-amber-700",
      dot: "bg-amber-400",
      label: "Warning",
    },
    blocked: {
      cls: "bg-red-950/60 text-red-300 border-red-700",
      dot: "bg-red-400",
      label: "Conflict Detected",
    },
  };

  const { cls, dot, label } = cfg[status] || cfg.none;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
