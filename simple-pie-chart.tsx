"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PieData {
  name: string;
  value: number;
  fill: string;
}

interface SimplePieChartProps {
  data: PieData[];
  className?: string;
  showLegend?: boolean;
}

export function SimplePieChart({
  data,
  className = "",
  showLegend = true,
}: SimplePieChartProps) {
  return (
    <div className={`h-[280px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as PieData;
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Count: <span className="font-semibold text-orange-600">{item.value}</span>
                  </p>
                  <p className="text-sm text-slate-600">Share: {percent}%</p>
                </div>
              );
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
