import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Loader2, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { landingFor } from "@/routes/nav";
import { ROLE_LABELS, type UserRole } from "@/types";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { DemoNotice, FormError } from "@/components/auth/DemoNotice";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";

const DEMO_ROLES: { role: UserRole; icon: typeof Truck }[] = [
  { role: "super_admin", icon: ShieldCheck }, { role: "municipal_admin", icon: Landmark }, { role: "collection_staff", icon: Truck },
];

export default function Login() {
  const { user, signIn, enterDemo, isDemo } = useAuth();
  const nav = useNavigate(); const from = (useLocation().state as { from?: string } | null)?.from;
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  if (user) return <Navigate to={landingFor(user.role, from)} replace />;

  const onSubmit = async (v: LoginValues) => {
    setError(null);
    try { const u = await signIn(v.email, v.password); nav(landingFor(u.role, from), { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed. Try again."); }
  };
  return (
    <AuthLayout title="Sign in" subtitle="Use your municipal account to continue.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
        <FormField label="Password" type="password" autoComplete="current-password" error={errors.password} {...register("password")} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Sign in</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">New to SmartWaste? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link></p>

      {isDemo && (
        <section className="mt-8 border-t pt-6" aria-labelledby="demo-h">
          <h2 id="demo-h" className="mb-3 text-sm font-semibold">Explore without an account</h2>
          <DemoNotice>Demo mode: no accounts or passwords exist and nothing is secured. Pick a role to preview that role’s view.</DemoNotice>
          <div className="mt-3 grid gap-2">
            {DEMO_ROLES.map(({ role, icon: Icon }) => (
              <Button key={role} variant="outline" className="justify-start" onClick={async () => { const u = await enterDemo(role); nav(landingFor(u.role, from), { replace: true }); }}>
                <Icon className="h-4 w-4" aria-hidden />Continue as {ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
        </section>
      )}
    </AuthLayout>
  );
}
