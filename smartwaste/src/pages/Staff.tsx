import { useMemo, useState } from "react";
import {
  Edit2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Power,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useCollections, useStaff } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { StaffModal } from "@/components/staff/StaffModal";
import { ZONES } from "@/services/mock/seed";
import type { Staff } from "@/types";
import { services } from "@/services";

export default function StaffPage() {
  const { data: staffList, loading, error, reload } = useStaff();
  const { data: collections } = useCollections();

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Map staff id to assigned tasks count
  const taskCountMap = useMemo(() => {
    const map = new Map<string, { active: number; completed: number }>();
    (collections || []).forEach((c) => {
      if (c.assignedStaffId) {
        const cur = map.get(c.assignedStaffId) || { active: 0, completed: 0 };
        if (["pending", "assigned", "in_progress"].includes(c.status)) {
          cur.active += 1;
        } else if (c.status === "completed") {
          cur.completed += 1;
        }
        map.set(c.assignedStaffId, cur);
      }
    });
    return map;
  }, [collections]);

  const metrics = useMemo(() => {
    if (!staffList) return { total: 0, active: 0, inactive: 0 };
    return {
      total: staffList.length,
      active: staffList.filter((s) => s.active).length,
      inactive: staffList.filter((s) => !s.active).length,
    };
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    return staffList.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.zone.toLowerCase().includes(q);

      const matchesZone = zoneFilter === "all" || s.zone === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [staffList, search, zoneFilter]);

  const handleAddStaff = async (formData: any) => {
    try {
      await services.staff.create(formData);
      await reload();
    } catch (err: any) {
      alert(`Failed to add worker: ${err.message}`);
    }
  };

  const handleUpdateStaff = async (formData: any) => {
    if (!selectedStaff) return;
    try {
      await services.staff.update(selectedStaff.id, formData);
      await reload();
      setSelectedStaff(null);
    } catch (err: any) {
      alert(`Failed to update worker: ${err.message}`);
    }
  };

  const handleToggleActive = async (s: Staff) => {
    try {
      await services.staff.update(s.id, { active: !s.active });
      await reload();
    } catch (err: any) {
      alert(`Could not toggle status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Field Operations"
        description="Manage municipal collection teams, zone assignments, driver rosters, and pickup fulfillment."
        actions={
          <Button onClick={() => setModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Personnel
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Registered Personnel"
          value={metrics.total}
          icon={Users}
          hint="Municipal staff & drivers"
        />
        <MetricCard
          label="Active On-Duty Staff"
          value={metrics.active}
          icon={UserCheck}
          hint="Available for route assignment"
        />
        <MetricCard
          label="Off-Duty / Inactive"
          value={metrics.inactive}
          icon={Power}
          tone="offline"
          hint="On leave or standby"
        />
      </div>

      {/* Search and Filter */}
      <Card className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative min-w-[260px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, phone, or email…"
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="w-48 h-9 text-xs"
        >
          <option value="all">All Municipal Zones</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </Select>
      </Card>

      {/* Loading & Error */}
      {loading && <LoadingState label="Loading staff personnel directory…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {/* Table Content */}
      {!loading && !error && filteredStaff.length === 0 && (
        <EmptyState
          title="No personnel found"
          description="Adjust your search query or zone filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setZoneFilter("all");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {!loading && !error && filteredStaff.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => {
            const taskStats = taskCountMap.get(staff.id) || { active: 0, completed: 0 };
            return (
              <Card
                key={staff.id}
                className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {staff.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-foreground leading-tight">
                          {staff.name}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {staff.id}
                        </span>
                      </div>
                    </div>
                    <Badge variant={staff.active ? "success" : "secondary"}>
                      {staff.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground border-y py-3">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{staff.zone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{staff.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-center text-xs">
                    <div className="p-2 rounded-lg bg-secondary/40">
                      <span className="block text-[11px] text-muted-foreground">Active Tasks</span>
                      <span className="font-bold text-sm text-foreground">{taskStats.active}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/40">
                      <span className="block text-[11px] text-muted-foreground">Completed</span>
                      <span className="font-bold text-sm text-status-normal">
                        {taskStats.completed}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Joined {new Date(staff.joinedAt).toLocaleDateString([], { month: "short", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setModalOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs px-2 ${
                        staff.active ? "text-destructive" : "text-status-normal"
                      }`}
                      onClick={() => handleToggleActive(staff)}
                    >
                      <Power className="h-3.5 w-3.5 mr-1" />
                      {staff.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Staff Add / Edit Modal */}
      <StaffModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStaff(null);
        }}
        onSubmit={selectedStaff ? handleUpdateStaff : handleAddStaff}
        initialData={selectedStaff}
      />
    </div>
  );
}
