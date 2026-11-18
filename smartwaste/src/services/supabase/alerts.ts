import type { AlertService } from "../interfaces";
import type { Alert, AlertSeverity, AlertStatus, AlertType } from "@/types";
import { supabase } from "./client";

const ensureClient = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
};

function mapDbAlert(row: any): Alert {
  return {
    id: row.id,
    type: (row.alert_type || "capacity_75") as AlertType,
    severity: (row.severity || "warning") as AlertSeverity,
    status: (row.status || "active") as AlertStatus,
    binId: row.smart_bins?.bin_code || row.bin_id,
    location: row.smart_bins?.name || "Municipal Ward",
    message: row.message,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

export const supabaseAlertService: AlertService = {
  async list(filter?: { status?: AlertStatus }): Promise<Alert[]> {
    const client = ensureClient();
    let query = client
      .from("alerts")
      .select("*, smart_bins(bin_code, name)")
      .order("created_at", { ascending: false });

    if (filter?.status) {
      query = query.eq("status", filter.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapDbAlert);
  },

  async resolve(id: string): Promise<Alert> {
    const client = ensureClient();
    const { data: user } = await client.auth.getUser();

    const { data, error } = await client
      .from("alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.user?.id || null,
      })
      .eq("id", id)
      .select("*, smart_bins(bin_code, name)")
      .single();

    if (error) throw error;
    return mapDbAlert(data);
  },
};
