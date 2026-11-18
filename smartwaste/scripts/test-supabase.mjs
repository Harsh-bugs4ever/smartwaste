import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const envLines = envContent.split("\n");
let url = "";
let key = "";

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("VITE_SUPABASE_URL=")) {
    url = trimmed.split("=")[1].trim();
  }
  if (trimmed.startsWith("VITE_SUPABASE_ANON_KEY=")) {
    key = trimmed.split("=")[1].trim();
  }
}

const supabase = createClient(url, key);

async function checkAll() {
  console.log("=== Checking Supabase Tables & Row Counts ===");
  const tables = [
    "zones",
    "waste_categories",
    "smart_bins",
    "iot_devices",
    "sensor_readings",
    "alerts",
    "staff",
    "collections",
    "profiles",
    "activity_logs"
  ];

  for (const table of tables) {
    try {
      const { data, count, error } = await supabase.from(table).select("*", { count: "exact" }).limit(3);
      if (error) {
        console.log(`❌ Table [${table}]: Error - ${error.message}`);
      } else {
        console.log(`✅ Table [${table}]: ${count} record(s) found.`);
        if (data && data.length > 0) {
          if (table === "smart_bins") {
            console.log(`   Sample bins: ${data.map(b => b.bin_code + ' (' + b.name + ')').join(', ')}`);
          } else if (table === "zones") {
            console.log(`   Sample zones: ${data.map(z => z.zone_name).join(', ')}`);
          } else if (table === "waste_categories") {
            console.log(`   Sample categories: ${data.map(c => c.name).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error checking ${table}:`, err.message);
    }
  }

  console.log("\n=== Checking Database Views ===");
  const views = ["view_bin_overview", "view_category_distribution", "view_zone_collections"];
  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select("*").limit(2);
      if (error) {
        console.log(`❌ View [${view}]: Error - ${error.message}`);
      } else {
        console.log(`✅ View [${view}]: Working! Data:`, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`Error checking view ${view}:`, err.message);
    }
  }
}

checkAll();
