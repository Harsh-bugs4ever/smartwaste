import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface Props { label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: "default" | "critical" | "warning" | "offline" }
const iconTone = { default: "bg-accent text-accent-foreground", critical: "bg-status-critical/12 text-status-critical", warning: "bg-status-warning/15 text-status-warning", offline: "bg-status-offline/15 text-status-offline" };
export function MetricCard({ label, value, hint, icon: Icon, tone = "default" }: Props) {
  return (
    <Card className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", iconTone[tone])}><Icon className="h-5 w-5" aria-hidden /></span>
    </Card>
  );
}
