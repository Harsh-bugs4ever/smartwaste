import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import { useAlerts } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { ALERT_TYPE_LABELS, type AlertSeverity, type AlertType } from "@/types";
import { services } from "@/services";

export default function Alerts() {
  const { data: alerts, loading, error, reload } = useAlerts();
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    if (!alerts) return { total: 0, active: 0, critical: 0, warnings: 0, resolved: 0 };
    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === "active").length,
      critical: alerts.filter((a) => a.status === "active" && a.severity === "critical").length,
      warnings: alerts.filter((a) => a.status === "active" && a.severity === "warning").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((a) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.binId.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || a.severity === severityFilter;
      const matchesType = typeFilter === "all" || a.type === typeFilter;

      return matchesSearch && matchesStatus && matchesSeverity && matchesType;
    });
  }, [alerts, search, statusFilter, severityFilter, typeFilter]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await services.alerts.resolve(id);
      await reload();
    } catch (err: any) {
      alert(`Could not resolve alert: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  const getAlertIcon = (type: AlertType, severity: AlertSeverity) => {
    if (type === "sensor_disconnected") return <WifiOff className="h-4 w-4" />;
    if (type === "overflow") return <AlertOctagon className="h-4 w-4" />;
    if (severity === "critical") return <AlertCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Management"
        description="Monitor automated incident alerts, threshold breaches, and sensor disconnect telemetry."
        actions={
          <Button variant="outline" size="sm" onClick={() => reload()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Alerts
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Incidents"
          value={counts.active}
          icon={Bell}
          tone={counts.active > 0 ? "warning" : "default"}
          hint="Requires municipal attention"
        />
        <MetricCard
          label="Critical Severity"
          value={counts.critical}
          icon={AlertCircle}
          tone="critical"
          hint="Immediate overflow risk"
        />
        <MetricCard
          label="Capacity Warnings"
          value={counts.warnings}
          icon={AlertTriangle}
          tone="warning"
          hint="75% - 89% threshold crossed"
        />
        <MetricCard
          label="Resolved Alerts"
          value={counts.resolved}
          icon={CheckCircle2}
          hint="Cleared or collected"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { label: "Active", value: "active", count: counts.active },
            { label: "Resolved", value: "resolved", count: counts.resolved },
            { label: "All Alerts", value: "all", count: counts.total },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by bin or message…"
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-32 h-9 text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Types</option>
            {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map((t) => (
              <option key={t} value={t}>
                {ALERT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Loading & Error */}
      {loading && <LoadingState label="Checking active municipal telemetry alerts…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <EmptyState
          title="No alerts match the criteria"
          description="Everything in this queue is clear. No threshold anomalies or disconnected devices."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("active");
                setSeverityFilter("all");
                setTypeFilter("all");
                setSearch("");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {/* Alert Feed / Table */}
      {!loading && !error && filteredAlerts.length > 0 && (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isResolved = alert.status === "resolved";
            return (
              <Card
                key={alert.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isResolved
                    ? "opacity-65 bg-secondary/20"
                    : alert.severity === "critical"
                    ? "border-status-critical/40 bg-status-critical/[0.02]"
                    : "border-status-warning/40 bg-status-warning/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={`p-2.5 rounded-lg shrink-0 ${
                      alert.severity === "critical"
                        ? "bg-status-critical/15 text-status-critical"
                        : alert.severity === "warning"
                        ? "bg-status-warning/15 text-status-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getAlertIcon(alert.type, alert.severity)}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {alert.binId}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-foreground">
                        {alert.location}
                      </span>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "warning"
                            ? "warning"
                            : "secondary"
                        }
                        className="uppercase text-[10px]"
                      >
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {ALERT_TYPE_LABELS[alert.type]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{alert.message}</p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Triggered:{" "}
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {isResolved && alert.resolvedAt && (
                        <span className="flex items-center gap-1 text-status-normal font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Resolved:{" "}
                          {new Date(alert.resolvedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isResolved && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-medium border-status-normal/40 text-status-normal hover:bg-status-normal/10"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolvingId === alert.id}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {resolvingId === alert.id ? "Resolving…" : "Resolve Alert"}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
