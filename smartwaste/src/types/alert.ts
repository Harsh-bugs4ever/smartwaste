export type AlertType = "capacity_75" | "capacity_90" | "overflow" | "sensor_disconnected" | "collection_overdue";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "resolved";
export interface Alert {
  id: string; type: AlertType; severity: AlertSeverity; status: AlertStatus; binId: string; location: string;
  message: string; createdAt: string; resolvedAt?: string;
}
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  capacity_75: "75% capacity", capacity_90: "90% capacity", overflow: "Overflow", sensor_disconnected: "Sensor disconnected", collection_overdue: "Collection overdue",
};
