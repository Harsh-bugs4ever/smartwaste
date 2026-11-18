import type { BinService } from "../interfaces";
import type { BinReading, NewBin, SmartBin, WasteCategory } from "@/types";
import { supabase } from "./client";

const ensureClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
};

// Maps raw database row to SmartBin domain entity
function mapDbBin(row: any): SmartBin {
  return {
    id: row.bin_code || row.id,
    location: row.name || row.location,
    area: row.zones?.zone_name || row.area || "Zone A",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    category: (row.waste_categories?.name?.toLowerCase() || row.category || "dry") as WasteCategory,
    capacityLitres: Number(row.capacity_liters || row.capacityLitres || 240),
    fillPercentage: Number(row.current_fill_percentage ?? row.fillPercentage ?? 0),
    sensorStatus: row.sensor_status || "online",
    lastUpdated: row.last_sensor_update || row.updated_at || row.created_at || new Date().toISOString(),
  };
}

export const supabaseBinService: BinService = {
  async list(): Promise<SmartBin[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from("smart_bins")
      .select("*, zones(zone_name), waste_categories(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbBin);
  },

  async get(id: string): Promise<SmartBin | null> {
    const client = ensureClient();
    const { data, error } = await client
      .from("smart_bins")
      .select("*, zones(zone_name), waste_categories(name)")
      .or(`bin_code.eq.${id},id.eq.${id}`)
      .single();

    if (error) return null;
    return mapDbBin(data);
  },

  async create(input: NewBin): Promise<SmartBin> {
    const client = ensureClient();

    // Find or fallback category
    const { data: cat } = await client
      .from("waste_categories")
      .select("id")
      .ilike("name", `%${input.category}%`)
      .limit(1)
      .single();

    // Find zone
    const { data: zone } = await client
      .from("zones")
      .select("id")
      .ilike("zone_name", `%${input.area}%`)
      .limit(1)
      .single();

    const insertPayload = {
      bin_code: `BIN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
      capacity_liters: input.capacityLitres,
      current_fill_percentage: input.fillPercentage ?? 0,
      sensor_status: input.sensorStatus ?? "online",
      waste_category_id: cat?.id || null,
      zone_id: zone?.id || null,
    };

    const { data, error } = await client
      .from("smart_bins")
      .insert(insertPayload)
      .select("*, zones(zone_name), waste_categories(name)")
      .single();

    if (error) throw error;
    return mapDbBin(data);
  },

  async update(id: string, patch: Partial<Omit<SmartBin, "id">>): Promise<SmartBin> {
    const client = ensureClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.location !== undefined) updatePayload.name = patch.location;
    if (patch.latitude !== undefined) updatePayload.latitude = patch.latitude;
    if (patch.longitude !== undefined) updatePayload.longitude = patch.longitude;
    if (patch.capacityLitres !== undefined) updatePayload.capacity_liters = patch.capacityLitres;
    if (patch.fillPercentage !== undefined) updatePayload.current_fill_percentage = patch.fillPercentage;
    if (patch.sensorStatus !== undefined) updatePayload.sensor_status = patch.sensorStatus;

    const { data, error } = await client
      .from("smart_bins")
      .update(updatePayload)
      .or(`bin_code.eq.${id},id.eq.${id}`)
      .select("*, zones(zone_name), waste_categories(name)")
      .single();

    if (error) throw error;
    return mapDbBin(data);
  },

  async remove(id: string): Promise<void> {
    const client = ensureClient();
    const { error } = await client
      .from("smart_bins")
      .delete()
      .or(`bin_code.eq.${id},id.eq.${id}`);

    if (error) throw error;
  },

  async readings(binId: string, limit = 24): Promise<BinReading[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from("sensor_readings")
      .select("*")
      .or(`bin_id.eq.${binId}`)
      .order("recorded_at", { ascending: true })
      .limit(limit);

    if (error || !data || data.length === 0) {
      // Return simulated telemetry if empty
      return Array.from({ length: limit }, (_, i) => ({
        id: `RD-${i}`,
        binId,
        fillPercentage: Math.min(95, Math.max(10, 20 + i * 3)),
        batteryPercentage: 95 - Math.floor(i / 5),
        temperatureC: 30,
        recordedAt: new Date(Date.now() - (limit - 1 - i) * 3600 * 1000).toISOString(),
      }));
    }

    return data.map((r: any) => ({
      id: r.id,
      binId: r.bin_id,
      fillPercentage: Number(r.fill_percentage),
      batteryPercentage: Number(r.battery_percentage || 90),
      temperatureC: Number(r.temperature_c || 28),
      recordedAt: r.recorded_at,
    }));
  },
};
