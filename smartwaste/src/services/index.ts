// The centralized module that UI components and hooks import services from.
import { alertService as mockAlerts, binService as mockBins, collectionService as mockCollections, staffService as mockStaff, statsService as mockStats } from "./mock/services";
import { authService as mockAuth } from "./mock/auth";
import { supabaseAlertService } from "./supabase/alerts";
import { supabaseBinService } from "./supabase/bins";
import { supabaseCollectionService } from "./supabase/collections";
import { supabaseStaffService } from "./supabase/staff";
import { supabaseStatsService } from "./supabase/stats";
import { supabaseAuthService } from "./supabase/auth";
import { isSupabaseConfigured } from "./supabase/client";

const dataSource = import.meta.env.VITE_DATA_SOURCE;
const useSupabase = dataSource === "supabase" && isSupabaseConfigured;

if (dataSource === "supabase" && !isSupabaseConfigured) {
  console.warn(
    "VITE_DATA_SOURCE is set to 'supabase' but VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. Falling back to mock services."
  );
}

export const services = {
  bins: useSupabase ? supabaseBinService : mockBins,
  alerts: useSupabase ? supabaseAlertService : mockAlerts,
  collections: useSupabase ? supabaseCollectionService : mockCollections,
  staff: useSupabase ? supabaseStaffService : mockStaff,
  stats: useSupabase ? supabaseStatsService : mockStats,
  auth: useSupabase ? supabaseAuthService : mockAuth,
};
