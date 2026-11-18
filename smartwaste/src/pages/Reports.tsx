import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Layers,
  MapPin,
} from "lucide-react";
import { useBins, useCollections, useStats } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState, LoadingState } from "@/components/common/States";
import { ZONES } from "@/services/mock/seed";

export default function Reports() {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: collections, loading: colLoading } = useCollections();
  const { data: bins } = useBins();

  const [reportType, setReportType] = useState<"collection" | "area" | "overflow">("collection");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [zoneFilter, setZoneFilter] = useState("all");

  const reportRows = useMemo(() => {
    if (reportType === "collection") {
      return (collections || []).map((c) => ({
        id: c.id,
        target: c.binId,
        location: c.location,
        area: c.area,
        timestamp: c.completedAt ? new Date(c.completedAt).toLocaleString() : "Pending",
        status: c.status,
        weightKg: c.collectedKg || 0,
      }));
    } else if (reportType === "area") {
      return (stats?.areas || []).map((a, i) => ({
        id: `AREA-${i + 1}`,
        target: a.area,
        location: `Ward Sector ${i + 1}`,
        area: a.area,
        timestamp: period,
        status: "Active",
        weightKg: a.kg,
        overflowCount: a.overflowIncidents,
      }));
    } else {
      // Overflow incident reports
      return (bins || [])
        .filter((b) => b.fillPercentage >= 85)
        .map((b) => ({
          id: `INC-${b.id}`,
          target: b.id,
          location: b.location,
          area: b.area,
          timestamp: new Date(b.lastUpdated).toLocaleString(),
          status: b.fillPercentage >= 95 ? "Critical Overflow" : "Threshold Warning",
          weightKg: Math.round(b.capacityLitres * (b.fillPercentage / 100) * 0.45),
        }));
    }
  }, [reportType, collections, stats, bins, period]);

  const handleExportCSV = () => {
    if (reportRows.length === 0) return;

    let headers = ["ID", "Target / Asset", "Location", "Area / Zone", "Timestamp", "Status", "Weight (kg)"];
    if (reportType === "area") headers.push("Overflow Incidents");

    const csvLines = [
      headers.join(","),
      ...reportRows.map((row: any) =>
        [
          `"${row.id}"`,
          `"${row.target}"`,
          `"${row.location}"`,
          `"${row.area}"`,
          `"${row.timestamp}"`,
          `"${row.status}"`,
          row.weightKg,
          ...(reportType === "area" ? [row.overflowCount || 0] : []),
        ].join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `smartwaste-${reportType}-report-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalReportKg = reportRows.reduce((acc, r: any) => acc + (r.weightKg || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Auditing & Reports"
        description="Generate official compliance reports, area generation breakdowns, and raw CSV data exports."
        actions={
          <Button onClick={handleExportCSV} className="gap-1.5 bg-primary">
            <Download className="h-4 w-4" /> Export CSV Data
          </Button>
        }
      />

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Report Records Logged"
          value={reportRows.length}
          icon={FileSpreadsheet}
          hint="Filtered row entries"
        />
        <MetricCard
          label="Aggregated Weight"
          value={`${totalReportKg.toLocaleString()} kg`}
          icon={Layers}
          hint="Reported waste volume"
        />
        <MetricCard
          label="Reporting Window"
          value={period.toUpperCase()}
          icon={Calendar}
          hint="Audit timeframe"
        />
      </div>

      {/* Report Controls */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={reportType}
            onValueChange={(v) => setReportType(v as any)}
            options={[
              { label: "Collection Runs", value: "collection" },
              { label: "Area Generation", value: "area" },
              { label: "Overflow Incidents", value: "overflow" },
            ]}
          />

          <div className="flex items-center gap-3">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-32 h-9 text-xs"
            >
              <option value="daily">Daily View</option>
              <option value="weekly">Weekly View</option>
              <option value="monthly">Monthly View</option>
            </Select>

            <Select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-44 h-9 text-xs"
            >
              <option value="all">All Zones</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      {statsLoading || colLoading ? (
        <LoadingState label="Compiling municipal audit data…" />
      ) : reportRows.length === 0 ? (
        <EmptyState title="No records found" description="Adjust your reporting filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Asset / Target</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Area / Zone</th>
                  <th className="px-4 py-3">Timestamp / Interval</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Recorded Weight</th>
                  {reportType === "area" && <th className="px-4 py-3 text-right">Incidents</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportRows.map((row: any, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.target}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.location}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {row.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.timestamp}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-right">
                      {row.weightKg.toLocaleString()} kg
                    </td>
                    {reportType === "area" && (
                      <td className="px-4 py-3 font-semibold text-right text-status-warning">
                        {row.overflowCount || 0}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
