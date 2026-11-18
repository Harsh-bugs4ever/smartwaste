import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const LoadingState = ({ label = "Loading…" }: { label?: string }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{label}</div>
);
export const EmptyState = ({ title, description, icon: Icon = Inbox, action }: { title: string; description?: string; icon?: LucideIcon; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 py-16 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="h-6 w-6" aria-hidden /></span>
    <h3 className="font-semibold">{title}</h3>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action}
  </div>
);
export const ErrorState = ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <div role="alert" className="flex flex-col items-center gap-2 py-16 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full bg-status-critical/12 text-status-critical"><AlertTriangle className="h-6 w-6" aria-hidden /></span>
    <h3 className="font-semibold">Couldn’t load this data</h3>
    <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
    {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
  </div>
);
