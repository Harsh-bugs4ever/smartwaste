import { BarChart3, Bell, FileText, LayoutDashboard, Map, Settings, Trash2, Truck, Users, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/types";
export interface NavItem { to: string; label: string; icon: LucideIcon; roles: UserRole[] }
const ALL: UserRole[] = ["super_admin", "municipal_admin", "collection_staff"];
const ADMIN: UserRole[] = ["super_admin", "municipal_admin"];
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { to: "/bins", label: "Smart Bins", icon: Trash2, roles: ALL },
  { to: "/map", label: "Live Map", icon: Map, roles: ALL },
  { to: "/alerts", label: "Alerts", icon: Bell, roles: ALL },
  { to: "/collections", label: "Collection Management", icon: Truck, roles: ALL },
  { to: "/analytics", label: "Waste Analytics", icon: BarChart3, roles: ADMIN },
  { to: "/staff", label: "Staff Management", icon: Users, roles: ADMIN },
  { to: "/reports", label: "Reports", icon: FileText, roles: ADMIN },
  { to: "/settings", label: "Settings", icon: Settings, roles: ALL },
];
export const canAccess = (role: UserRole, path: string) => NAV_ITEMS.some((n) => n.to === path && n.roles.includes(role));
/** Where each role lands after sign-in. Field staff go straight to their work queue. */
export const homeFor = (role: UserRole) => (role === "collection_staff" ? "/collections" : "/dashboard");
/** Honour the page a user was sent away from, but only if their role may open it. */
export const landingFor = (role: UserRole, from?: string) => (from && canAccess(role, from) ? from : homeFor(role));
