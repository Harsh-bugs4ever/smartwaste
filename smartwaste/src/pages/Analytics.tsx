import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  Layers,
  PieChart as PieIcon,
  Recycle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useStats, useTrend } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { MetricCard } from "@/components/common/MetricCard";
import { ErrorState, LoadingState } from "@/components/common/States";
import { CATEGORY_LABELS, type TrendPeriod, type WasteCategory } from "@/types";

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  wet: "#059669",
  dry: "#3b82f6",
  plastic: "#f59e0b",
  paper: "#8b5cf6",
  e_waste: "#ef4444",
};

export default function Analytics() {
  const { data: stats, loading, error, reload } = useStats();
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("daily");
  const { data: trendData, loading: trendLoading } = useTrend(trendPeriod);

  const pieData = (stats?.segregation || []).map((s) => ({
    name: CATEGORY_LABELS[s.category],
    value: s.kg,
    category: s.category,
    color: CATEGORY_COLORS[s.category],
  }));

  const totalKg = pieData.reduce((acc, c) => acc + c.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Segregation & Fleet Analytics"
        description="Deep telemetry insights, municipal area comparisons, category segregation, and operational efficiency."
      />

      {loading && <LoadingState label="Computing municipal waste distribution models…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {stats && (
        <>
          {/* Top Performance KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Segregation Efficiency"
              value={`${stats.segregationEfficiency}%`}
              icon={Recycle}
              hint="Source-level sorting accuracy"
            />
            <MetricCard
              label="Total Waste Logged"
              value={`${(totalKg / 1000).toFixed(1)} Metric Tons`}
              icon={Layers}
              hint="Aggregated net weight"
            />
            <MetricCard
              label="Municipal Wards Monitored"
              value={stats.areas.length}
              icon={BarChart3}
              hint="Active coverage zones"
            />
            <MetricCard
              label="Route Completion Rate"
              value={`${Math.round(
                (stats.completedCollections /
                  Math.max(1, stats.completedCollections + stats.pendingCollections)) *
                  100
              )}%`}
              icon={CheckCircle2}
              hint="On-time pickup fulfillment"
            />
          </div>

          {/* Row 1: Segregation Pie & Line Trend */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Category Pie Chart */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-primary" /> Waste Category Distribution
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proportion of materials diverted across the city
                </p>
              </div>

              <div className="h-64 w-full relative my-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(val: number) => [`${val.toLocaleString()} kg`, "Payload"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold">{stats.segregationEfficiency}%</span>
                  <span className="text-[10px] text-muted-foreground">Efficiency</span>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-3">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </span>
                    <span className="font-medium text-foreground">
                      {d.value.toLocaleString()} kg (
                      {totalKg > 0 ? Math.round((d.value / totalKg) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Collection Trends Line/Area Chart */}
            <Card className="lg:col-span-2 p-5 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Historical Collection Volumes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kilograms collected and route runs over time
                  </p>
                </div>
                <Tabs
                  value={trendPeriod}
                  onValueChange={(v) => setTrendPeriod(v as TrendPeriod)}
                  options={[
                    { label: "Daily", value: "daily" },
                    { label: "Weekly", value: "weekly" },
                    { label: "Monthly", value: "monthly" },
                  ]}
                />
              </div>

              <div className="h-72 w-full">
                {trendLoading ? (
                  <LoadingState label="Recalculating trend time-series…" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData || []}
                      margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                      <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}t`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(v: number, name: string) => [
                          name === "collectedKg" ? `${v.toLocaleString()} kg` : v,
                          name === "collectedKg" ? "Collected Weight" : "Pickups",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="collectedKg"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fill="url(#trendGradient)"
                        name="collectedKg"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Row 2: Area-wise Generation Bar Chart & Monthly Completion Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Area-Wise Waste Generation */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Area-Wise Waste Generation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparison across municipal zones and ward sectors
                </p>
              </div>

              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.areas}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis
                      dataKey="area"
                      stroke="#888888"
                      fontSize={10}
                      angle={-25}
                      textAnchor="end"
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(v: number) => [`${v.toLocaleString()} kg`, "Generation"]}
                    />
                    <Bar dataKey="kg" fill="#059669" radius={[4, 4, 0, 0]} name="Waste (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Monthly Target vs Completed Bar Chart */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Monthly Collection Performance
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scheduled routes vs actual verified completions
                </p>
              </div>

              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.monthly}
                    margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                    />
                    <Bar
                      dataKey="scheduled"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      name="Scheduled Pickups"
                    />
                    <Bar
                      dataKey="completed"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      name="Completed Pickups"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* AI Municipal Insights Box */}
          <Card className="p-5 border-primary/30 bg-primary/[0.03]">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground">
                  Intelligent Route Optimization & Segregation Recommendation
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Wet waste generation peaks in Fort and Crawford Market between 06:00 and 10:00.
                  Pre-scheduling morning collection runs in Zone A will reduce overflow incidents by
                  an estimated 34%. Dry and plastic waste sorting efficiency in Western Suburbs (Zone
                  B) remains high at 82%.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
