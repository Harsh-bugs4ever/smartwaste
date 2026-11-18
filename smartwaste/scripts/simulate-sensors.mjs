/**
 * SmartWaste IoT Sensor Telemetry Simulator
 * Simulates ESP32 ultrasonic sensors installed in municipal bins.
 * Sends distance measurements, calculated fill level, and battery telemetry.
 *
 * Usage:
 *   node scripts/simulate-sensors.mjs
 */

const ENDPOINT = process.env.SENSOR_ENDPOINT || "http://localhost:54321/functions/v1/ingest-sensor-data";
const DEVICE_KEY = process.env.DEVICE_KEY || "esp32-secure-secret-token";

const TEST_BINS = [
  { deviceCode: "ESP32-1001", binCode: "BIN-1001", distance: 68 }, // ~35% normal
  { deviceCode: "ESP32-1002", binCode: "BIN-1002", distance: 26 }, // ~82% warning
  { deviceCode: "ESP32-1003", binCode: "BIN-1003", distance: 16 }, // ~93% critical
  { deviceCode: "ESP32-1004", binCode: "BIN-1004", distance: 48 }, // ~58% normal
  { deviceCode: "ESP32-1005", binCode: "BIN-1005", distance: 12 }, // ~98% overflow
];

async function sendTelemetry(bin) {
  // Add small natural sensor jitter (+/- 2 cm)
  const jitter = (Math.random() - 0.5) * 4;
  const measuredDistanceCm = Math.max(10, Math.min(100, Math.round(bin.distance + jitter)));

  const payload = {
    deviceCode: bin.deviceCode,
    binCode: bin.binCode,
    measuredDistanceCm,
    batteryPercentage: Math.round(85 + Math.random() * 12),
    temperatureC: Math.round(27 + Math.random() * 6),
    timestamp: new Date().toISOString(),
  };

  try {
    console.log(`[IoT Sim] Transmitting telemetry for ${bin.binCode} (${measuredDistanceCm} cm)...`);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-secret": DEVICE_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[IoT Sim] Success: ${bin.binCode} -> Fill: ${data.fillPercentage}% [${data.status}]`);
    } else {
      console.warn(`[IoT Sim] Server responded with status ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn(`[IoT Sim] Could not connect to endpoint ${ENDPOINT}. (Backend may be offline or in mock mode)`);
  }
}

async function run() {
  console.log("=== Starting SmartWaste IoT Telemetry Pulse ===");
  console.log(`Target ingestion endpoint: ${ENDPOINT}`);
  for (const bin of TEST_BINS) {
    await sendTelemetry(bin);
  }
  console.log("=== Pulse complete ===");
}

run();
