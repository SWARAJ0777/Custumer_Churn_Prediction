"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FeatureData {
  feature: string;
  contribution: number;
}

interface FeatureImportanceChartProps {
  data: FeatureData[];
  className?: string;
}

export function FeatureImportanceChart({ data, className = "" }: FeatureImportanceChartProps) {
  const sorted = [...data].sort((a, b) => a.contribution - b.contribution);

  return (
    <div className={`h-[340px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 64, bottom: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, 1]}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <YAxis
            type="category"
            dataKey="feature"
            tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as FeatureData;
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="text-sm font-medium text-slate-900">{item.feature}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Importance: <span className="font-semibold text-orange-600">{(item.contribution * 100).toFixed(1)}%</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="contribution" radius={[0, 6, 6, 0]} animationDuration={800}>
            {sorted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#f97316" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
