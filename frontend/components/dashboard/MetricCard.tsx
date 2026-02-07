"use client";

import type { MetricCardProps } from "@/lib/types";

export function MetricCard({
  title,
  value,
  icon,
  description,
  accentColor,
  compact,
}: MetricCardProps) {
  return (
    <div
      className="metric-card relative overflow-hidden"
      style={compact ? { padding: "0.75rem" } : undefined}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center justify-center rounded-lg ${
            compact ? "h-7 w-7 text-base" : "h-10 w-10 text-xl"
          }`}
          style={{
            background: accentColor
              ? `color-mix(in srgb, ${accentColor} 10%, transparent)`
              : undefined,
          }}
        >
          {icon}
        </span>
        <span
          className="uppercase tracking-wide text-muted"
          style={{ fontSize: "var(--text-caption)" }}
        >
          {title}
        </span>
      </div>
      <div className={compact ? "mt-2" : "mt-4"}>
        <p
          className="font-mono font-bold"
          style={{ fontSize: compact ? "var(--text-title)" : "var(--text-display)" }}
        >
          {value}
        </p>
        <p
          className="mt-1 text-muted"
          style={{ fontSize: "var(--text-detail)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
