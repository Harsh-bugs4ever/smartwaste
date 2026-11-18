import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Battery, Clock, MapPin, Trash2, Wifi } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/common/States";
import { deriveBinStatus, STATUS_HEX } from "@/utils/binStatus";
import { CATEGORY_LABELS, type BinReading, type SmartBin } from "@/types";
import { services } from "@/services";

interface Props {
  open: boolean;
  onClose: () => void;
  bin: SmartBin | null;
  onSchedulePickup?: (bin: SmartBin) => void;
}

export function BinDetailsModal({ open, onClose, bin, onSchedulePickup }: Props) {
  const [readings, setReadings] = useState<BinReading[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bin && open) {
      setLoading(true);
      services.bins
        .readings(bin.id, 24)
        .then((res) => setReadings(res))
        .catch((err) => console.error("Error loading readings:", err))
        .finally(() => setLoading(false));
    }
  }, [bin, open]);

  if (!bin) return null;

  const status = deriveBinStatus(bin);
  const color = STATUS_HEX[status];
  const chartData = readings.map((r) => ({
    time: new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fill: r.fillPercentage,
    battery: r.batteryPercentage,
    temp: r.temperatureC,
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Smart Bin Telemetry: ${bin.id}`}
      description={`${bin.location}, ${bin.area}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-secondary/50 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Category</span>
            <span className="font-semibold">{CATEGORY_LABELS[bin.category]}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Capacity</span>
            <span className="font-semibold">{bin.capacityLitres} Litres</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Status</span>
            <StatusBadge status={status} />
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Sensor</span>
            <Badge variant={bin.sensorStatus === "online" ? "success" : "outline"}>
              {bin.sensorStatus === "online" ? "Online (ESP32)" : "Offline"}
            </Badge>
          </div>
        </div>

        {/* Current Level Visualizer */}
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <Trash2 className="h-4 w-4 text-muted-foreground" /> Current Fill Level
            </span>
            <span className="font-bold text-lg" style={{ color }}>
              {bin.fillPercentage}%
            </span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, bin.fillPercentage))}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last ping: {new Date(bin.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Historical 24-Hour Telemetry Graph */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">24-Hour Sensor Telemetry</h4>
            <span className="text-xs text-muted-foreground">Fill % vs Time</span>
          </div>

          <div className="h-48 w-full border rounded-lg p-2 bg-card">
            {loading ? (
              <LoadingState label="Fetching sensor logs…" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(val: number) => [`${val}%`, "Fill Level"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="fill"
                    stroke={color}
                    strokeWidth={2}
                    fill={color}
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-center text-muted-foreground pt-16">No telemetry recorded yet.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Battery className="h-3.5 w-3.5 text-status-normal" /> 88% Battery
            <Wifi className="h-3.5 w-3.5 ml-2 text-primary" /> LoRaWAN Signal -74dBm
          </div>
          <div className="flex items-center gap-2">
            {onSchedulePickup && (
              <button
                type="button"
                onClick={() => {
                  onSchedulePickup(bin);
                  onClose();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Schedule Pickup
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
