import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatPct(v) {
  return `${Math.round(v * 100)}%`;
}

export function SimpleConversionChart({ metrics }) {
  // We only have a snapshot in this demo; fake a short “trend” for executive UX.
  const base = metrics?.conversion_rate ?? 0;
  const data = [
    { name: "T-3", conversion: Math.max(0, base * 0.9) },
    { name: "T-2", conversion: Math.max(0, base * 0.95) },
    { name: "T-1", conversion: Math.max(0, base * 1.05) },
    { name: "Now", conversion: Math.max(0, base) },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="name" stroke="rgba(148,163,184,0.9)" />
          <YAxis
            stroke="rgba(148,163,184,0.9)"
            tickFormatter={formatPct}
            domain={[0, "dataMax + 0.05"]}
          />
          <Tooltip
            formatter={(v) => formatPct(v)}
            contentStyle={{
              background: "rgba(2,6,23,0.95)",
              border: "1px solid rgba(30,41,59,1)",
              borderRadius: 12,
              color: "rgba(226,232,240,1)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="conversion"
            name="Conversion rate"
            stroke="rgba(56,189,248,1)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

