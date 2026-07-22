"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface BarData {
  name: string;
  value: number;
  fill?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  xKey?: string;
  yKey?: string;
  yFormatter?: (value: number) => string;
  valueLabel?: string;
  color?: string;
  className?: string;
}

export function SimpleBarChart({
  data,
  xKey = "name",
  yKey = "value",
  yFormatter = (v) => `${(v * 100).toFixed(0)}%`,
  valueLabel = "Value",
  color = "#f97316",
  className = "",
}: SimpleBarChartProps) {
  return (
    <div className={`h-[280px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFormatter}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {valueLabel}: <span className="font-semibold text-orange-600">{yFormatter(payload[0].value as number)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey={yKey} radius={[6, 6, 0, 0]} animationDuration={800}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
