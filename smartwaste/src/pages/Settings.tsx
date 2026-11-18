import { useState } from "react";
import {
  CheckCircle2,
  Database,
  Moon,
  Save,
  Server,
  Sliders,
  Sun,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { ROLE_LABELS } from "@/types";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  const [warningThreshold, setWarningThreshold] = useState(75);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [heartbeatTimeout, setHeartbeatTimeout] = useState(360);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const dataSource = import.meta.env.VITE_DATA_SOURCE || "mock";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Settings & Configuration"
        description="Configure municipal thresholds, IoT network parameters, system roles, and display preferences."
      />

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-status-normal/15 p-3 text-sm text-status-normal border border-status-normal/30 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> System parameters updated successfully!
        </div>
      )}

      {/* User Profile Card */}
      <Card className="p-5">
        <h3 className="font-semibold text-base text-foreground flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" /> Active Operator Profile
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Operator Name</label>
            <Input value={user?.name || "Administrator"} readOnly className="bg-secondary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email Address</label>
            <Input value={user?.email || "admin@smartwaste.example"} readOnly className="bg-secondary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Role & Authority</label>
            <div className="pt-2">
              <Badge variant="default" className="text-xs font-medium">
                {user ? ROLE_LABELS[user.role] : "Super Admin"}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Municipal Jurisdiction</label>
            <Input value="Mumbai Metropolitan Region (MMR)" readOnly className="bg-secondary/40" />
          </div>
        </div>
      </Card>

      {/* IoT & Telemetry Threshold Settings */}
      <form onSubmit={handleSave}>
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" /> IoT Telemetry Thresholds
          </h3>
          <p className="text-xs text-muted-foreground">
            Automatic alert triggers and collection priority dispatch rules applied to ESP32 ultrasonic readings.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div>
              <label className="text-xs font-medium block mb-1">Warning Threshold (%)</label>
              <Input
                type="number"
                min="50"
                max="85"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">Default: 75% fill level</span>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Critical Threshold (%)</label>
              <Input
                type="number"
                min="80"
                max="98"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">Default: 90% fill level</span>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Sensor Offline Timeout (mins)</label>
              <Input
                type="number"
                min="30"
                max="1440"
                value={heartbeatTimeout}
                onChange={(e) => setHeartbeatTimeout(Number(e.target.value))}
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">Trigger disconnect warning</span>
            </div>
          </div>

          <div className="pt-3 border-t flex justify-end">
            <Button type="submit" size="sm" className="gap-1.5">
              <Save className="h-4 w-4" /> Save Thresholds
            </Button>
          </div>
        </Card>
      </form>

      {/* Backend & Environment Card */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" /> Backend & Data Infrastructure
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border rounded-lg p-3 bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Active Data Source</p>
              <p className="text-muted-foreground">
                Configured via <code className="font-mono text-primary">VITE_DATA_SOURCE</code>
              </p>
            </div>
          </div>
          <Badge variant={dataSource === "supabase" ? "success" : "secondary"}>
            {dataSource === "supabase" ? "Supabase Cloud (PostgreSQL)" : "Centralized Mock / Demo"}
          </Badge>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            Interface Appearance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Switch between light and dark municipal themes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </Card>
    </div>
  );
}
