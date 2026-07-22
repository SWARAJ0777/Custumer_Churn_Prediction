interface BadgeProps {
  children: React.ReactNode;
  variant?: "low" | "medium" | "high" | "default" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    high: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    default: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    outline: "bg-white text-slate-600 ring-1 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
