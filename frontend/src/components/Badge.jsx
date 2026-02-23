const styles = {
  low: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
  high: "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20",
};

export function Badge({ severity }) {
  const s = (severity || "low").toLowerCase();
  const cls = styles[s] || styles.low;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
}

