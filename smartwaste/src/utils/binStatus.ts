import type { BinStatus, SmartBin } from "@/types";
export const WARNING_THRESHOLD = 75;
export const CRITICAL_THRESHOLD = 90;
export function deriveBinStatus(bin: Pick<SmartBin, "fillPercentage" | "sensorStatus">): BinStatus {
  if (bin.sensorStatus === "offline") return "offline";
  if (bin.fillPercentage >= CRITICAL_THRESHOLD) return "critical";
  if (bin.fillPercentage >= WARNING_THRESHOLD) return "warning";
  return "normal";
}
export const STATUS_LABELS: Record<BinStatus, string> = { normal: "Normal", warning: "Warning", critical: "Critical", offline: "Offline" };
export const STATUS_HEX: Record<BinStatus, string> = { normal: "#2f9e5f", warning: "#e0a106", critical: "#dc3b3b", offline: "#7b8794" };
