import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAlerts } from "@/hooks/useData";
import { ROLE_LABELS } from "@/types";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth(); const { theme, toggle } = useTheme(); const nav = useNavigate();
  const alerts = useAlerts(); const active = alerts.data?.filter((a) => a.status === "active").length ?? 0;
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
      <form className="relative max-w-md flex-1" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/bins?q=${encodeURIComponent(q.trim())}`); }}>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bins by ID or location" className="pl-9" aria-label="Search bins" />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        <Button variant="ghost" size="icon" className="relative" onClick={() => nav("/alerts")} aria-label={`Alerts, ${active} active`}>
          <Bell className="h-4 w-4" />
          {active > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-status-critical px-1 text-[10px] font-semibold text-white">{active}</span>}
        </Button>
        <div className="ml-2 hidden items-center gap-3 border-l pl-3 sm:flex">
          <div className="text-right leading-tight"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-muted-foreground">{user && ROLE_LABELS[user.role]}</p></div>
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(); nav("/login"); }} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={async () => { await signOut(); nav("/login"); }} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
