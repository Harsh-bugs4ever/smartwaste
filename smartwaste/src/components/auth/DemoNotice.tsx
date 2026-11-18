import { Info } from "lucide-react";
export const DemoNotice = ({ children }: { children: React.ReactNode }) => (
  <p className="flex gap-2 rounded-md border border-status-warning/40 bg-status-warning/10 p-3 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" aria-hidden /><span>{children}</span></p>
);
export const FormError = ({ message }: { message: string | null }) =>
  message ? <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null;
