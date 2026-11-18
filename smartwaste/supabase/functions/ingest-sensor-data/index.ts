// Supabase Edge Function: IoT Sensor Data Ingestion
// Run on Deno / Supabase Edge Runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

interface SensorPayload {
  deviceCode: string;
  binCode: string;
  measuredDistanceCm: number;
  batteryPercentage?: number;
  temperatureC?: number;
  timestamp?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate IoT device credential
    const deviceSecret = req.headers.get("x-device-secret");
    const body: SensorPayload = await req.json();

    if (!body.deviceCode || !body.binCode || body.measuredDistanceCm === undefined) {
      return new Response(
        JSON.stringify({ error: "Invalid sensor payload: deviceCode, binCode, and measuredDistanceCm are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify registered IoT device
    const { data: device, error: devErr } = await supabase
      .from("iot_devices")
      .select("id, bin_id, is_active, secret_hash")
      .eq("device_code", body.deviceCode)
      .single();

    if (devErr || !device) {
      return new Response(
        JSON.stringify({ error: `Unregistered device: ${body.deviceCode}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!device.is_active) {
      return new Response(
        JSON.stringify({ error: "Device is deactivated by municipal administrator" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional verification of secret token
    if (device.secret_hash && deviceSecret && device.secret_hash !== deviceSecret) {
      return new Response(
        JSON.stringify({ error: "Invalid device authentication secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch associated smart bin
    const { data: bin, error: binErr } = await supabase
      .from("smart_bins")
      .select("id, bin_code, name, capacity_liters")
      .eq("id", device.bin_id)
      .single();

    if (binErr || !bin) {
      return new Response(
        JSON.stringify({ error: `No active bin assigned to device ${body.deviceCode}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Ultrasonic distance calculation
    // Standard bin height ~ 100 cm. Sensor mounted at top.
    // 10 cm or less = 100% full (overflow risk).
    // 95 cm or more = 0% full (empty baseline).
    const MAX_HEIGHT_CM = 100;
    const MIN_DISTANCE_CM = 10;
    const measuredDist = Math.max(MIN_DISTANCE_CM, Math.min(MAX_HEIGHT_CM, body.measuredDistanceCm));
    const fillPercentage = Math.round(
      ((MAX_HEIGHT_CM - measuredDist) / (MAX_HEIGHT_CM - MIN_DISTANCE_CM)) * 100
    );

    // Determine status
    let binStatus = "normal";
    if (fillPercentage >= 95) {
      binStatus = "critical"; // overflow
    } else if (fillPercentage >= 90) {
      binStatus = "critical";
    } else if (fillPercentage >= 75) {
      binStatus = "warning";
    }

    const recordedAt = body.timestamp || new Date().toISOString();

    // 4. Record telemetry entry in sensor_readings
    const { error: readErr } = await supabase.from("sensor_readings").insert({
      device_id: device.id,
      bin_id: bin.id,
      measured_distance_cm: body.measuredDistanceCm,
      fill_percentage: fillPercentage,
      battery_percentage: body.batteryPercentage ?? 92,
      temperature_c: body.temperatureC ?? 28,
      recorded_at: recordedAt,
      received_at: new Date().toISOString(),
    });

    if (readErr) console.error("Error inserting reading:", readErr);

    // 5. Update bin operational status
    await supabase
      .from("smart_bins")
      .update({
        current_fill_percentage: fillPercentage,
        status: binStatus,
        sensor_status: "online",
        last_sensor_update: new Date().toISOString(),
      })
      .eq("id", bin.id);

    // Update device last_seen_at
    await supabase
      .from("iot_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    // 6. Automated Alert Generation (deduplicated against existing active alerts)
    if (fillPercentage >= 75) {
      const alertType =
        fillPercentage >= 98
          ? "overflow"
          : fillPercentage >= 90
          ? "capacity_90"
          : "capacity_75";

      const severity = alertType === "capacity_75" ? "warning" : "critical";
      const message =
        alertType === "overflow"
          ? `Bin ${bin.bin_code} has reached overflow capacity (${fillPercentage}%). Urgent pickup required.`
          : `Bin ${bin.bin_code} capacity threshold reached at ${fillPercentage}%.`;

      // Check if active alert already exists for this bin and condition
      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("bin_id", bin.id)
        .eq("alert_type", alertType)
        .eq("status", "active")
        .limit(1)
        .single();

      if (!existingAlert) {
        await supabase.from("alerts").insert({
          bin_id: bin.id,
          alert_type: alertType,
          severity,
          message,
          status: "active",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        binCode: bin.bin_code,
        fillPercentage,
        status: binStatus,
        recordedAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
