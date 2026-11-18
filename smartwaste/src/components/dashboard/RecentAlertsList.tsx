import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/useData";
import { services } from "@/services";
import { cn } from "@/lib/utils";

export function RecentAlertsList() {
  const { data: alerts, reload } = useAlerts();

  const handleResolve = async (id: string) => {
    try {
      await services.alerts.resolve(id);
      await reload();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const activeAlerts = (alerts || [])
    .filter((a) => a.status === "active")
    .slice(0, 5);

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Active Alerts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time critical bin & sensor warnings
          </p>
        </div>
        <Link
          to="/alerts"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px]">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-status-normal mb-1" />
            <p className="text-sm font-medium">All systems nominal</p>
            <p className="text-xs">No active alerts requiring attention.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={cn(
                    "mt-0.5 p-1 rounded-md shrink-0",
                    alert.severity === "critical"
                      ? "bg-status-critical/15 text-status-critical"
                      : alert.severity === "warning"
                      ? "bg-status-warning/15 text-status-warning"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {alert.severity === "critical" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <TriangleAlert className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {alert.binId} – {alert.location}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2 shrink-0 hover:bg-background"
                onClick={() => handleResolve(alert.id)}
              >
                Resolve
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
