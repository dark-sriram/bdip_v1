import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";

function fmtPct(v) { return `${Math.round(v * 100)}%`; }

export function SimpleConversionChart({ metrics }) {
  const base = metrics?.conversion_rate ?? 0;
  const data = [
    { name: "T-3", conversion: Math.max(0, base * 0.9)  },
    { name: "T-2", conversion: Math.max(0, base * 0.95) },
    { name: "T-1", conversion: Math.max(0, base * 1.05) },
    { name: "Now", conversion: Math.max(0, base)        },
  ];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--text-3)" tick={{ fill: "var(--text-3)", fontSize: 11 }} />
          <YAxis stroke="var(--text-3)" tick={{ fill: "var(--text-3)", fontSize: 11 }}
            tickFormatter={fmtPct} domain={[0, "dataMax + 0.05"]} />
          <Tooltip
            formatter={v => [fmtPct(v)]}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ color: "var(--text-2)", fontSize: 12 }} />
          <Line type="monotone" dataKey="conversion" name="Conversion rate"
            stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
