import type { StaffService } from "../interfaces";
import type { Staff } from "@/types";
import { supabase } from "./client";

const ensureClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
};

function mapDbStaff(row: any): Staff {
  return {
    id: row.employee_code || row.id,
    name: row.profiles?.full_name || row.name || "Worker",
    email: row.profiles?.email || row.email || "worker@smartwaste.example",
    phone: row.profiles?.phone || row.phone || "+91 98000 00000",
    zone: row.zones?.zone_name || row.zone || "Zone A – Island City",
    active: row.availability_status === "active" || row.active === true,
    joinedAt: row.created_at || new Date().toISOString(),
  };
}

export const supabaseStaffService: StaffService = {
  async list(): Promise<Staff[]> {
    const client = ensureClient();
    const { data, error } = await client
      .from("staff")
      .select("*, profiles(full_name, email, phone), zones(zone_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbStaff);
  },

  async create(input: Omit<Staff, "id" | "joinedAt" | "active">): Promise<Staff> {
    const client = ensureClient();

    // Look up zone
    const { data: zone } = await client
      .from("zones")
      .select("id")
      .ilike("zone_name", `%${input.zone}%`)
      .limit(1)
      .single();

    const employeeCode = `STF-${Math.floor(200 + Math.random() * 800)}`;

    const { data, error } = await client
      .from("staff")
      .insert({
        employee_code: employeeCode,
        zone_id: zone?.id || null,
        availability_status: "active",
      })
      .select("*, profiles(full_name, email, phone), zones(zone_name)")
      .single();

    if (error) throw error;
    return mapDbStaff({
      ...data,
      name: input.name,
      email: input.email,
      phone: input.phone,
    });
  },

  async update(id: string, patch: Partial<Omit<Staff, "id">>): Promise<Staff> {
    const client = ensureClient();
    const updatePayload: Record<string, any> = {};

    if (patch.active !== undefined) {
      updatePayload.availability_status = patch.active ? "active" : "inactive";
    }

    const { data, error } = await client
      .from("staff")
      .update(updatePayload)
      .or(`employee_code.eq.${id},id.eq.${id}`)
      .select("*, profiles(full_name, email, phone), zones(zone_name)")
      .single();

    if (error) throw error;
    return mapDbStaff(data);
  },
};
