import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { forgotSchema, type ForgotValues } from "@/lib/validation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/DemoNotice";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null); const [sent, setSent] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const onSubmit = async ({ email }: ForgotValues) => {
    setError(null);
    try { await resetPassword(email); setSent(email); } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t send the reset link. Try again."); }
  };
  if (sent) return (
    <AuthLayout title="Check your email">
      <p className="flex gap-2 text-sm"><MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />If an account exists for {sent}, a reset link is on its way.</p>
      <Button asChild variant="outline" className="mt-6 w-full"><Link to="/login">Back to sign in</Link></Button>
    </AuthLayout>
  );
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we’ll send a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Send reset link</Button>
      </form>
      <p className="mt-5 text-center text-sm"><Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  );
}
