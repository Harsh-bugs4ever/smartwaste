import type { CollectionService } from "../interfaces";
import type { Collection, CollectionStatus } from "@/types";
import { supabase } from "./client";

const ensureClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
};

function mapDbCollection(row: any): Collection {
  return {
    id: row.id,
    binId: row.smart_bins?.bin_code || row.bin_id,
    location: row.smart_bins?.name || "Collection Route",
    area: row.zones?.zone_name || row.area || "Zone A",
    scheduledFor: row.scheduled_at || row.created_at,
    status: (row.collection_status || "pending") as CollectionStatus,
    assignedStaffId: row.assigned_staff_id || undefined,
    completedAt: row.completed_at || undefined,
    collectedKg: row.collected_quantity_kg ? Number(row.collected_quantity_kg) : undefined,
    notes: row.remarks || undefined,
  };
}

export const supabaseCollectionService: CollectionService = {
  async list(): Promise<Collection[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from("collections")
      .select("*, smart_bins(bin_code, name, zone_id), zones(zone_name)")
      .order("scheduled_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbCollection);
  },

  async create(input: Pick<Collection, "binId" | "scheduledFor"> & { assignedStaffId?: string; notes?: string }): Promise<Collection> {
    const client = ensureClient();

    // Look up bin uuid
    const { data: bin } = await client
      .from("smart_bins")
      .select("id, zone_id")
      .or(`bin_code.eq.${input.binId},id.eq.${input.binId}`)
      .single();

    const insertPayload = {
      bin_id: bin?.id || input.binId,
      zone_id: bin?.zone_id || null,
      scheduled_at: input.scheduledFor,
      collection_status: input.assignedStaffId ? "assigned" : "pending",
      assigned_staff_id: input.assignedStaffId || null,
      remarks: input.notes || null,
    };

    const { data, error } = await client
      .from("collections")
      .insert(insertPayload)
      .select("*, smart_bins(bin_code, name), zones(zone_name)")
      .single();

    if (error) throw error;
    return mapDbCollection(data);
  },

  async assign(id: string, staffId: string): Promise<Collection> {
    const client = ensureClient();
    const { data, error } = await client
      .from("collections")
      .update({
        assigned_staff_id: staffId,
        collection_status: "assigned",
      })
      .eq("id", id)
      .select("*, smart_bins(bin_code, name), zones(zone_name)")
      .single();

    if (error) throw error;
    return mapDbCollection(data);
  },

  async setStatus(id: string, status: CollectionStatus, collectedKg?: number): Promise<Collection> {
    const client = ensureClient();
    const updatePayload: Record<string, any> = {
      collection_status: status,
    };

    if (status === "in_progress") {
      updatePayload.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
      if (collectedKg !== undefined) {
        updatePayload.collected_quantity_kg = collectedKg;
      }
    }

    const { data, error } = await client
      .from("collections")
      .update(updatePayload)
      .eq("id", id)
      .select("*, smart_bins(id, bin_code, name), zones(zone_name)")
      .single();

    if (error) throw error;

    // When completed, reset bin fill level to 3% (empty baseline) and update timestamp
    if (status === "completed" && data.smart_bins?.id) {
      await client
        .from("smart_bins")
        .update({
          current_fill_percentage: 3,
          status: "normal",
          last_sensor_update: new Date().toISOString(),
        })
        .eq("id", data.smart_bins.id);
    }

    return mapDbCollection(data);
  },
};
