import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute, RoleGuard } from "@/routes/guards";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import SmartBins from "@/pages/SmartBins";
import LiveMap from "@/pages/LiveMap";
import Alerts from "@/pages/Alerts";
import Collections from "@/pages/Collections";
import Analytics from "@/pages/Analytics";
import Staff from "@/pages/Staff";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const ADMIN = ["super_admin", "municipal_admin"] as const;

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Municipal Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Accessible by all logged in roles */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bins" element={<SmartBins />} />
                <Route path="/map" element={<LiveMap />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/settings" element={<Settings />} />

                {/* Restricted to Super Admin and Municipal Administrators */}
                <Route element={<RoleGuard roles={[...ADMIN]} />}>
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
