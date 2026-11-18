import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Play,
  Plus,
  Search,
  Truck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCollections, useStaff } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { MetricCard } from "@/components/common/MetricCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { CompleteCollectionModal } from "@/components/collections/CompleteCollectionModal";
import type { Collection, CollectionStatus } from "@/types";
import { services } from "@/services";

export default function Collections() {
  const { data: collections, loading, error, reload } = useCollections();
  const { data: staffList } = useStaff();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completingCollection, setCompletingCollection] = useState<Collection | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const staffMap = useMemo(() => {
    const map = new Map<string, string>();
    (staffList || []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [staffList]);

  const metrics = useMemo(() => {
    if (!collections) return { total: 0, active: 0, completed: 0, totalKg: 0 };
    return {
      total: collections.length,
      active: collections.filter((c) => ["pending", "assigned", "in_progress"].includes(c.status)).length,
      completed: collections.filter((c) => c.status === "completed").length,
      totalKg: collections.reduce((acc, c) => acc + (c.collectedKg || 0), 0),
    };
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (!collections) return [];
    return collections.filter((c) => {
      const q = search.toLowerCase().trim();
      const staffName = c.assignedStaffId ? staffMap.get(c.assignedStaffId) || "" : "";
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.binId.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        staffName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [collections, search, statusFilter, staffMap]);

  const handleCreateCollection = async (formData: any) => {
    try {
      await services.collections.create(formData);
      await reload();
    } catch (err: any) {
      alert(`Failed to create collection run: ${err.message}`);
    }
  };

  const handleAssignStaff = async (collectionId: string, staffId: string) => {
    try {
      await services.collections.assign(collectionId, staffId);
      await reload();
      setAssigningId(null);
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  const handleStatusChange = async (collectionId: string, status: CollectionStatus) => {
    try {
      await services.collections.setStatus(collectionId, status);
      await reload();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCompleteConfirm = async (collectionId: string, collectedKg: number, _remarks?: string) => {
    try {
      await services.collections.setStatus(collectionId, "completed", collectedKg);
      await reload();
    } catch (err: any) {
      alert(`Failed to complete run: ${err.message}`);
    }
  };

  const getStatusBadge = (status: CollectionStatus) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>;
      case "assigned":
        return <Badge variant="secondary">Assigned</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Collection Operations"
        description="Schedule, dispatch, and track municipal waste collection vehicles and assigned personnel."
        actions={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Schedule Collection
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Routes / Tasks"
          value={metrics.active}
          icon={Truck}
          tone="warning"
          hint="Pending, assigned, or en route"
        />
        <MetricCard
          label="Completed Collections"
          value={metrics.completed}
          icon={CheckCircle2}
          hint="Verified field runs"
        />
        <MetricCard
          label="Collected Waste Weight"
          value={`${metrics.totalKg.toLocaleString()} kg`}
          icon={Calendar}
          hint="Logged payload weight"
        />
        <MetricCard
          label="Total Scheduled Tasks"
          value={metrics.total}
          icon={Clock}
          hint="All recorded pickups"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { label: "All Runs", value: "all", count: metrics.total },
            { label: "In Flight", value: "in_progress" },
            { label: "Assigned", value: "assigned" },
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed", count: metrics.completed },
          ]}
        />

        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search run ID, bin, area, or driver…"
            className="pl-9 h-9 text-xs"
          />
        </div>
      </Card>

      {/* Loading & Error */}
      {loading && <LoadingState label="Loading collection operations database…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {/* Table Content */}
      {!loading && !error && filteredCollections.length === 0 && (
        <EmptyState
          title="No collection tasks found"
          description="Create a new pickup run or adjust your status filters."
          action={
            <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")}>
              View All
            </Button>
          }
        />
      )}

      {!loading && !error && filteredCollections.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Bin & Location</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Scheduled For</th>
                  <th className="px-4 py-3">Payload</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCollections.map((col) => {
                  const staffName = col.assignedStaffId ? staffMap.get(col.assignedStaffId) : null;
                  return (
                    <tr key={col.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{col.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{col.binId}</div>
                        <div className="text-xs text-muted-foreground">{col.location}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {col.area}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {assigningId === col.id ? (
                          <Select
                            className="h-8 text-xs w-40"
                            onChange={(e) => {
                              if (e.target.value) handleAssignStaff(col.id, e.target.value);
                            }}
                            defaultValue=""
                          >
                            <option value="">Choose Staff</option>
                            {(staffList || [])
                              .filter((s) => s.active)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </Select>
                        ) : staffName ? (
                          <span className="text-foreground">{staffName}</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary underline p-0"
                            onClick={() => setAssigningId(col.id)}
                          >
                            + Assign Worker
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(col.scheduledFor).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {col.collectedKg !== undefined ? `${col.collectedKg} kg` : "—"}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(col.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {col.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() => setAssigningId(col.id)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" /> Assign
                            </Button>
                          )}
                          {col.status === "assigned" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 text-primary"
                              onClick={() => handleStatusChange(col.id, "in_progress")}
                            >
                              <Play className="h-3 w-3 mr-1" /> Start Run
                            </Button>
                          )}
                          {col.status === "in_progress" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2 bg-status-normal hover:bg-status-normal/90 text-white"
                              onClick={() => setCompletingCollection(col)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                            </Button>
                          )}
                          {col.status !== "completed" && col.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-1.5 text-muted-foreground hover:text-destructive"
                              title="Cancel Run"
                              onClick={() => handleStatusChange(col.id, "cancelled")}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {col.status === "completed" && (
                            <span className="text-[11px] text-muted-foreground italic">
                              Logged {new Date(col.completedAt || "").toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Collection Task Modal */}
      <CreateCollectionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCollection}
      />

      {/* Complete Collection Modal */}
      <CompleteCollectionModal
        open={completingCollection !== null}
        onClose={() => setCompletingCollection(null)}
        collection={completingCollection}
        onConfirm={handleCompleteConfirm}
      />
    </div>
  );
}
