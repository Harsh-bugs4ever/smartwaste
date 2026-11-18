import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/routes/nav";
import { registerSchema, type RegisterValues } from "@/lib/validation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormError } from "@/components/auth/DemoNotice";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";

export default function Register() {
  const { user, signUp } = useAuth();
  const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "" } });
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  if (done) return (
    <AuthLayout title="Check your email">
      <p className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />We sent a confirmation link. Once confirmed, an administrator assigns your role and zone.</p>
      <Button asChild variant="outline" className="mt-6 w-full"><Link to="/login">Back to sign in</Link></Button>
    </AuthLayout>
  );
  const onSubmit = async ({ name, email, password }: RegisterValues) => {
    setError(null);
    try { await signUp({ name, email, password }); setDone(true); } catch (e) { setError(e instanceof Error ? e.message : "Registration failed. Try again."); }
  };
  return (
    <AuthLayout title="Create your account" subtitle="Accounts start without privileges until an administrator approves them.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Full name" autoComplete="name" error={errors.name} {...register("name")} />
        <FormField label="Work email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
        <FormField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.password} {...register("password")} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword} {...register("confirmPassword")} />
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Create account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </AuthLayout>
  );
}
