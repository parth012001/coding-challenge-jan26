"use client";

import { useOrchardStore } from "@/lib/store";

export function DashboardPanel({ children }: { children: React.ReactNode }) {
  const dashboardOpen = useOrchardStore((s) => s.dashboardOpen);

  return (
    <aside
      className={`dashboard-panel ${dashboardOpen ? "open" : ""}`}
    >
      <div className="p-5">
        {children}
      </div>
    </aside>
  );
}
