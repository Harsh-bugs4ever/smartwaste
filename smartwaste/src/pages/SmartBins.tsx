import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarPlus,
  CheckCircle2,
  Edit2,
  Eye,
  Grid,
  List,
  MapPin,
  Plus,
  Search,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useBins } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BinModal } from "@/components/bins/BinModal";
import { BinDetailsModal } from "@/components/bins/BinDetailsModal";
import { DeleteConfirmModal } from "@/components/bins/DeleteConfirmModal";
import { deriveBinStatus, STATUS_HEX } from "@/utils/binStatus";
import { CATEGORY_LABELS, type SmartBin, type WasteCategory } from "@/types";
import { services } from "@/services";

export default function SmartBins() {
  const { data: bins, loading, error, reload } = useBins();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and Filter states
  const searchQuery = searchParams.get("q") || "";
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedBin, setSelectedBin] = useState<SmartBin | null>(null);
  const [detailsBin, setDetailsBin] = useState<SmartBin | null>(null);
  const [deleteBin, setDeleteBin] = useState<SmartBin | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Quick schedule notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredBins = useMemo(() => {
    if (!bins) return [];
    return bins.filter((bin) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        bin.id.toLowerCase().includes(q) ||
        bin.location.toLowerCase().includes(q) ||
        bin.area.toLowerCase().includes(q);

      const status = deriveBinStatus(bin);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesCategory = categoryFilter === "all" || bin.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bins, searchQuery, statusFilter, categoryFilter]);

  const handleCreateBin = async (formData: any) => {
    try {
      await services.bins.create(formData);
      await reload();
      showToast("Smart Bin successfully registered!");
    } catch (err: any) {
      alert(`Failed to create bin: ${err.message}`);
    }
  };

  const handleUpdateBin = async (formData: any) => {
    if (!selectedBin) return;
    try {
      await services.bins.update(selectedBin.id, formData);
      await reload();
      showToast(`Bin ${selectedBin.id} updated!`);
    } catch (err: any) {
      alert(`Failed to update bin: ${err.message}`);
    }
  };

  const handleDeleteBin = async () => {
    if (!deleteBin) return;
    setActionLoading(true);
    try {
      await services.bins.remove(deleteBin.id);
      await reload();
      setDeleteBin(null);
      showToast(`Bin ${deleteBin.id} decommissioned.`);
    } catch (err: any) {
      alert(`Failed to delete bin: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePickup = async (bin: SmartBin) => {
    try {
      await services.collections.create({
        binId: bin.id,
        scheduledFor: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        notes: `Automated pickup dispatch for ${bin.fillPercentage}% fill`,
      });
      showToast(`Pickup task queued for ${bin.id}!`);
    } catch (err: any) {
      alert(`Could not schedule collection: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Bin Management"
        description="Monitor IoT telemetry, physical capacities, and device states across all municipal zones."
        actions={
          <Button onClick={() => setModalMode("create")} className="gap-1.5">
            <Plus className="h-4 w-4" /> Register Bin
          </Button>
        }
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground shadow-xl animate-in slide-in-from-bottom">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value;
              setSearchParams(q ? { q } : {});
            }}
            placeholder="Search by ID, location, or area…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning (≥75%)</option>
            <option value="critical">Critical (≥90%)</option>
            <option value="offline">Offline</option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as WasteCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>

          <div className="flex items-center border rounded-md p-0.5 bg-muted">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded ${viewMode === "table" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && <LoadingState label="Loading registered smart bins…" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {/* Content Rendering */}
      {!loading && !error && filteredBins.length === 0 && (
        <EmptyState
          title="No smart bins found"
          description="Try clearing your search query or adjusting status and category filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchParams({});
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {!loading && !error && filteredBins.length > 0 && viewMode === "table" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Bin ID</th>
                  <th className="px-4 py-3">Location & Area</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Fill Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sensor</th>
                  <th className="px-4 py-3">Last Update</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBins.map((bin) => {
                  const status = deriveBinStatus(bin);
                  const color = STATUS_HEX[status];
                  return (
                    <tr key={bin.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {bin.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{bin.location}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {bin.area}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{CATEGORY_LABELS[bin.category]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{bin.fillPercentage}%</span>
                            <span className="text-[10px] text-muted-foreground">{bin.capacityLitres}L</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, bin.fillPercentage))}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {bin.sensorStatus === "online" ? (
                          <span className="inline-flex items-center gap-1 text-status-normal font-medium">
                            <Wifi className="h-3.5 w-3.5" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-status-offline font-medium">
                            <WifiOff className="h-3.5 w-3.5" /> Offline
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(bin.lastUpdated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View Telemetry"
                            onClick={() => setDetailsBin(bin)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Schedule Pickup"
                            onClick={() => handleSchedulePickup(bin)}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit Bin"
                            onClick={() => {
                              setSelectedBin(bin);
                              setModalMode("edit");
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Decommission Bin"
                            onClick={() => setDeleteBin(bin)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {!loading && !error && filteredBins.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBins.map((bin) => {
            const status = deriveBinStatus(bin);
            const color = STATUS_HEX[status];
            return (
              <Card key={bin.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {bin.id}
                      </span>
                      <h4 className="font-semibold text-foreground text-base mt-0.5">
                        {bin.location}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {bin.area}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="my-4 space-y-2 p-3 rounded-lg bg-secondary/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Fill Level</span>
                      <span className="font-bold text-sm" style={{ color }}>
                        {bin.fillPercentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, bin.fillPercentage))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Category: {CATEGORY_LABELS[bin.category]}</span>
                      <span>Capacity: {bin.capacityLitres}L</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {bin.sensorStatus === "online" ? (
                      <Wifi className="h-3.5 w-3.5 text-status-normal" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-status-offline" />
                    )}
                    <span>{bin.sensorStatus}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setDetailsBin(bin)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary"
                      onClick={() => handleSchedulePickup(bin)}
                    >
                      Pickup
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <BinModal
        open={modalMode !== null}
        onClose={() => {
          setModalMode(null);
          setSelectedBin(null);
        }}
        onSubmit={modalMode === "create" ? handleCreateBin : handleUpdateBin}
        initialData={selectedBin}
      />

      {/* Telemetry Details Modal */}
      <BinDetailsModal
        open={detailsBin !== null}
        onClose={() => setDetailsBin(null)}
        bin={detailsBin}
        onSchedulePickup={handleSchedulePickup}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteBin !== null}
        onClose={() => setDeleteBin(null)}
        onConfirm={handleDeleteBin}
        bin={deleteBin}
        loading={actionLoading}
      />
    </div>
  );
}
