import { NavLink } from "react-router-dom";
import { Leaf, X } from "lucide-react";
import { NAV_ITEMS } from "@/routes/nav";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((n) => user && n.roles.includes(user.role));
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")} aria-label="Primary">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Leaf className="h-4 w-4" aria-hidden /></span>
            <span className="text-lg font-semibold tracking-tight">SmartWaste</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close menu"><X className="h-4 w-4" /></Button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              <Icon className="h-4 w-4" aria-hidden />{label}
            </NavLink>
          ))}
        </nav>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">Mumbai Metropolitan Region</p>
      </aside>
    </>
  );
}
