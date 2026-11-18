import { Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Gauge,
  MapPin,
  Plus,
  Trash2,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { useStats } from "@/hooks/useData";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RecentAlertsList } from "@/components/dashboard/RecentAlertsList";
import { RecentCollectionsList } from "@/components/dashboard/RecentCollectionsList";

export default function Dashboard() {
  const { data, loading, error, reload } = useStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Urban Waste Management Overview"
        description="Real-time telemetric monitoring, fleet dispatching, and municipal analytics."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/bins">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Bin
              </Button>
            </Link>
            <Link to="/map">
              <Button size="sm" variant="outline" className="gap-1.5">
                <MapPin className="h-4 w-4" /> Live Map
              </Button>
            </Link>
            <Link to="/reports">
              <Button size="sm" className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> Reports
              </Button>
            </Link>
          </div>
        }
      />

      {loading && <LoadingState label="Loading network overview…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          {/* Top KPI Metrics Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Registered Bins"
              value={data.totalBins}
              icon={Trash2}
              hint="Total managed assets"
            />
            <MetricCard
              label="Active Online Bins"
              value={data.activeBins}
              icon={Activity}
              hint={`${Math.round((data.activeBins / Math.max(1, data.totalBins)) * 100)}% operational`}
            />
            <MetricCard
              label="Offline / Unreachable"
              value={data.offlineBins}
              icon={WifiOff}
              tone="offline"
              hint="Check sensor power & network"
            />
            <MetricCard
              label="Critical (≥90% Full)"
              value={data.criticalBins}
              icon={TriangleAlert}
              tone="critical"
              hint="Immediate pickup required"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Pending Collections"
              value={data.pendingCollections}
              icon={Clock}
              tone="warning"
              hint="In dispatch queue"
            />
            <MetricCard
              label="Completed Pickups"
              value={data.completedCollections}
              icon={CheckCircle2}
              hint="Past 30-day window"
            />
            <MetricCard
              label="Average Fill Level"
              value={`${data.averageFillPercentage}%`}
              icon={Gauge}
              hint="Across active sensors"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart />
            </div>
            <div>
              <CategoryBreakdown data={data.segregation} />
            </div>
          </div>

          {/* Activity & Alerts Feeds Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <RecentAlertsList />
            <RecentCollectionsList />
          </div>
        </>
      )}
    </div>
  );
}
