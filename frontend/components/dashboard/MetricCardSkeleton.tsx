"use client";

export function MetricCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className="metric-card animate-pulse"
      style={compact ? { padding: "0.75rem" } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className={`${compact ? "h-6 w-6" : "h-8 w-8"} rounded bg-skeleton`} />
        <div className="h-4 w-20 rounded bg-skeleton" />
      </div>
      <div className={compact ? "mt-2" : "mt-4"}>
        <div className={`${compact ? "h-5 w-16" : "h-8 w-24"} rounded bg-skeleton`} />
        <div className="mt-2 h-4 w-32 rounded bg-skeleton" />
      </div>
    </div>
  );
}
