import { forwardRef, useId, type InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: FieldError; hint?: string }
export const FormField = forwardRef<HTMLInputElement, Props>(({ label, error, hint, className, id, ...p }, ref) => {
  const auto = useId(); const fid = id ?? auto; const msg = `${fid}-msg`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={fid} className="text-sm font-medium">{label}</label>
      <Input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error || hint ? msg : undefined} className={cn(error && "border-destructive")} {...p} />
      {error ? <p id={msg} role="alert" className="text-xs text-destructive">{error.message}</p> : hint ? <p id={msg} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
});
FormField.displayName = "FormField";
