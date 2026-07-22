"use client";

interface GaugeChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function GaugeChart({
  value,
  size = 160,
  strokeWidth = 14,
  label,
  className = "",
}: GaugeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.7;
  const dashoffset = arc - arc * Math.max(0, Math.min(1, value));

  let color = "#22c55e";
  if (value > 0.35) color = "#f59e0b";
  if (value > 0.65) color = "#ef4444";

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[125deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-3xl font-bold text-slate-900">{Math.round(value * 100)}%</span>
        {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
      </div>
    </div>
  );
}
