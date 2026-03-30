const styles = {
  low: "bg-[#006045]/10 text-[#006045] ring-1 ring-emerald-500/20",
  medium: "bg-[#82181a]/10 text-[#82181a] ring-1 ring-amber-500/20",
  high: "bg-[#82181a]/10 text-[#82181a] ring-1 ring-rose-500/20",
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

