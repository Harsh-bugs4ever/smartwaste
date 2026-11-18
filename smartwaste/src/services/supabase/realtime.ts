import { useEffect } from "react";
import { supabase } from "./client";

export interface RealtimePayload<T = any> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
}

export function subscribeToBins(onUpdate: (payload: RealtimePayload) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("realtime:smart_bins")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "smart_bins" },
      (payload) => onUpdate(payload as unknown as RealtimePayload)
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

export function subscribeToAlerts(onUpdate: (payload: RealtimePayload) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("realtime:alerts")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "alerts" },
      (payload) => onUpdate(payload as unknown as RealtimePayload)
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

export function subscribeToCollections(onUpdate: (payload: RealtimePayload) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("realtime:collections")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "collections" },
      (payload) => onUpdate(payload as unknown as RealtimePayload)
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

/** React hook for easy real-time subscription to bins */
export function useRealtimeBins(onRefresh: () => void) {
  useEffect(() => {
    const unsubscribe = subscribeToBins(() => onRefresh());
    return () => unsubscribe();
  }, [onRefresh]);
}
