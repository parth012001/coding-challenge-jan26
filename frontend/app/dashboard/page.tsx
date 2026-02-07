import { OrchardStage } from "@/components/orchard/OrchardStage";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { DashboardPanel } from "@/components/layout/DashboardPanel";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MatchQualityHistogram } from "@/components/dashboard/MatchQualityHistogram";
import { SatisfactionGapChart } from "@/components/dashboard/SatisfactionGapChart";
import { AttributeWeightChart } from "@/components/dashboard/AttributeWeightChart";
import { RecentMatchesFeed } from "@/components/dashboard/RecentMatchesFeed";

// =============================================================================
// PAGE
// =============================================================================

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Main stage */}
      <main className="flex flex-1 flex-col p-6">
        <ErrorBoundary>
          <OrchardStage />
        </ErrorBoundary>
      </main>

      {/* Sidebar with all analytics */}
      <DashboardPanel>
        <div className="space-y-4">
          <DashboardOverview />
          <div className="card card--chart">
            <MatchQualityHistogram />
          </div>
          <div className="card card--chart">
            <SatisfactionGapChart />
          </div>
          <div className="card card--chart">
            <AttributeWeightChart />
          </div>
          <RecentMatchesFeed />
        </div>
      </DashboardPanel>
    </div>
  );
}
