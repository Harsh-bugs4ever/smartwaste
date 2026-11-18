import { Link } from "react-router-dom";
import { ArrowRight, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCollections } from "@/hooks/useData";
import { COLLECTION_STATUS_LABELS, type CollectionStatus } from "@/types";

export function RecentCollectionsList() {
  const { data: collections } = useCollections();

  const statusBadgeVariant = (status: CollectionStatus) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "assigned":
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const recent = (collections || []).slice(0, 5);

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-base">Collection Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recent pickup tasks and field progress
          </p>
        </div>
        <Link
          to="/collections"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[310px]">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Truck className="h-8 w-8 text-muted mb-1" />
            <p className="text-sm font-medium">No recent collections</p>
          </div>
        ) : (
          recent.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-secondary/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-lg bg-background text-primary border shrink-0">
                  <Truck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.location} ({item.binId})
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{item.area}</span>
                    <span>•</span>
                    <span>
                      {item.completedAt
                        ? `Finished ${new Date(item.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : `Scheduled ${new Date(item.scheduledFor).toLocaleDateString([], { month: "short", day: "numeric" })}`}
                    </span>
                    {item.collectedKg !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">{item.collectedKg} kg</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Badge variant={statusBadgeVariant(item.status)} className="shrink-0 capitalize">
                {COLLECTION_STATUS_LABELS[item.status]}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
