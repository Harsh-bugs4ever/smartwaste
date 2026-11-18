import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CalendarPlus,
  Eye,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { useBins } from "@/hooks/useData";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BinDetailsModal } from "@/components/bins/BinDetailsModal";
import { LoadingState } from "@/components/common/States";
import { deriveBinStatus, STATUS_HEX } from "@/utils/binStatus";
import { CATEGORY_LABELS, type BinStatus, type SmartBin, type WasteCategory } from "@/types";
import { services } from "@/services";

// Helper to recenter map
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Function to generate customized HTML DivIcon for Leaflet with colored status and pulsing animation for critical
function createBinIcon(status: BinStatus, fill: number) {
  const color = STATUS_HEX[status];
  const isCritical = status === "critical";

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
      ${
        isCritical
          ? `<span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
          : ""
      }
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: ${color};
        border: 2.5px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: -0.5px;
      ">
        ${fill}%
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-bin-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export default function LiveMap() {
  const { data: bins, loading, reload } = useBins();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedBin, setSelectedBin] = useState<SmartBin | null>(null);
  const [detailsBin, setDetailsBin] = useState<SmartBin | null>(null);

  // Default center: Mumbai (average of bins)
  const defaultCenter: [number, number] = [19.05, 72.88];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const filteredBins = useMemo(() => {
    if (!bins) return [];
    return bins.filter((bin) => {
      const q = search.toLowerCase().trim();
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
  }, [bins, search, statusFilter, categoryFilter]);

  const handleFocusBin = (bin: SmartBin) => {
    setSelectedBin(bin);
    setMapCenter([bin.latitude, bin.longitude]);
    setMapZoom(15);
  };

  const handleSchedulePickup = async (bin: SmartBin) => {
    try {
      await services.collections.create({
        binId: bin.id,
        scheduledFor: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        notes: `Map dispatch: current fill ${bin.fillPercentage}%`,
      });
      alert(`Pickup scheduled for ${bin.id}!`);
      reload();
    } catch (err: any) {
      alert(`Error scheduling collection: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live Monitoring Map"
        description="Geographical telemetry of waste bins across municipal sectors with fill-level markers."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMapCenter(defaultCenter);
                setMapZoom(12);
              }}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset View
            </Button>
          </div>
        }
      />

      {/* Map Control Bar */}
      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-sm">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter markers by location/ID…"
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32 h-8 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="normal">Normal (&lt;75%)</option>
            <option value="warning">Warning (75-89%)</option>
            <option value="critical">Critical (≥90%)</option>
            <option value="offline">Offline</option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-32 h-8 text-xs"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as WasteCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>

          {/* Marker Legend */}
          <div className="hidden xl:flex items-center gap-3 border-l pl-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-status-normal" /> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-status-warning" /> Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-status-critical" /> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-status-offline" /> Offline
            </span>
          </div>
        </div>
      </Card>

      {/* Map + Sidebar Layout */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Interactive Leaflet Map */}
        <Card className="lg:col-span-3 h-[600px] overflow-hidden relative border rounded-xl z-0">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingState label="Initializing geospatial map layers…" />
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} zoom={mapZoom} />

              {filteredBins.map((bin) => {
                const status = deriveBinStatus(bin);
                const color = STATUS_HEX[status];
                return (
                  <Marker
                    key={bin.id}
                    position={[bin.latitude, bin.longitude]}
                    icon={createBinIcon(status, bin.fillPercentage)}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 min-w-[200px] space-y-2">
                        <div className="flex items-start justify-between gap-2 border-b pb-1.5">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {bin.id}
                            </span>
                            <h4 className="font-semibold text-xs text-foreground leading-tight">
                              {bin.location}
                            </h4>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium text-foreground">{CATEGORY_LABELS[bin.category]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span className="font-medium text-foreground">{bin.capacityLitres} Litres</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fill Level:</span>
                            <span className="font-bold" style={{ color }}>{bin.fillPercentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sensor:</span>
                            <span className="font-medium">
                              {bin.sensorStatus === "online" ? "Online" : "Disconnected"}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                            <span>Updated:</span>
                            <span>{new Date(bin.lastUpdated).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] flex-1 px-1"
                            onClick={() => setDetailsBin(bin)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Telemetry
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] flex-1 px-1"
                            onClick={() => handleSchedulePickup(bin)}
                          >
                            <CalendarPlus className="h-3 w-3 mr-1" /> Pickup
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </Card>

        {/* Quick Inspector List on Map Sidebar */}
        <Card className="p-4 h-[600px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Visible Bins ({filteredBins.length})
              </h3>
              <span className="text-xs text-muted-foreground">Click to center</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
              {filteredBins.map((bin) => {
                const status = deriveBinStatus(bin);
                const color = STATUS_HEX[status];
                const active = selectedBin?.id === bin.id;
                return (
                  <div
                    key={bin.id}
                    onClick={() => handleFocusBin(bin)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "hover:bg-secondary/60 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{bin.id}</span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-muted-foreground truncate">{bin.location}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t text-[11px]">
                      <span className="text-muted-foreground">{CATEGORY_LABELS[bin.category]}</span>
                      <span className="font-bold" style={{ color }}>{bin.fillPercentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Bin Telemetry Modal */}
      <BinDetailsModal
        open={detailsBin !== null}
        onClose={() => setDetailsBin(null)}
        bin={detailsBin}
        onSchedulePickup={handleSchedulePickup}
      />
    </div>
  );
}
