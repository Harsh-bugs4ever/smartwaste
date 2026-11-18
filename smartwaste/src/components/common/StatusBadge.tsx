import type { BinStatus } from "@/types";
import { STATUS_LABELS } from "@/utils/binStatus";
import { cn } from "@/lib/utils";
const tone: Record<BinStatus, string> = {
  normal: "bg-status-normal/12 text-status-normal", warning: "bg-status-warning/15 text-status-warning",
  critical: "bg-status-critical/12 text-status-critical", offline: "bg-status-offline/15 text-status-offline",
};
const dot: Record<BinStatus, string> = { normal: "bg-status-normal", warning: "bg-status-warning", critical: "bg-status-critical", offline: "bg-status-offline" };
export function StatusBadge({ status, label, className }: { status: BinStatus; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", tone[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} aria-hidden />{label ?? STATUS_LABELS[status]}
    </span>
  );
}
