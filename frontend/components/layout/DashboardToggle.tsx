"use client";

import { useOrchardStore } from "@/lib/store";

export function DashboardToggle() {
  const toggle = useOrchardStore((s) => s.toggleDashboard);
  const dashboardOpen = useOrchardStore((s) => s.dashboardOpen);
  const historyCount = useOrchardStore((s) => s.conversationHistory.length);

  return (
    <button
      aria-label={dashboardOpen ? "Close analytics panel" : "Open analytics panel"}
      onClick={toggle}
      className={`fixed bottom-6 right-6 z-[var(--z-toggle)] flex items-center gap-2 rounded-full px-4 py-3 font-medium text-sm shadow-lg transition-all lg:hidden ${
        dashboardOpen
          ? "bg-pear text-white"
          : "bg-card border border-border hover:shadow-xl"
      }`}
    >
      <span>{dashboardOpen ? "✕" : "📊"}</span>
      {!dashboardOpen && historyCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pear text-[10px] font-bold text-white">
          {historyCount}
        </span>
      )}
    </button>
  );
}
