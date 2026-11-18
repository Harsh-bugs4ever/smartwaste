import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/common/States";
import type { UserRole } from "@/types";
import { homeFor } from "./nav";

export function ProtectedRoute() {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <LoadingState label="Checking session…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
export function RoleGuard({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}
