import type { Alert, BinReading, Collection, SmartBin, Staff, WasteCategory } from "@/types";
import { deriveBinStatus } from "@/utils/binStatus";

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

export const ZONES = ["Zone A – Island City", "Zone B – Western Suburbs", "Zone C – Eastern Suburbs", "Zone D – Navi Mumbai"];

// [location, area, lat, lng, category, capacity, fill, offline?]
type Row = [string, string, number, number, WasteCategory, number, number, boolean?];
const rows: Row[] = [
  ["Colaba Causeway", "Colaba", 18.9217, 72.8332, "dry", 240, 34],
  ["Gateway of India Promenade", "Colaba", 18.922, 72.8347, "plastic", 240, 82],
  ["CSMT Station Road", "Fort", 18.9398, 72.8355, "wet", 360, 93],
  ["Marine Drive – Chowpatty", "Churchgate", 18.9543, 72.8143, "wet", 360, 58],
  ["Crawford Market", "Fort", 18.9473, 72.8337, "wet", 480, 96],
  ["Dadar Flower Market", "Dadar", 19.0178, 72.8416, "wet", 480, 88],
  ["Dadar TT Circle", "Dadar", 19.0187, 72.8477, "paper", 240, 41],
  ["Worli Sea Face", "Worli", 19.0096, 72.8156, "dry", 240, 22],
  ["Lower Parel Mills", "Lower Parel", 18.9942, 72.8258, "paper", 360, 67],
  ["Bandra Linking Road", "Bandra", 19.0657, 72.8347, "plastic", 240, 79],
  ["Bandra Reclamation", "Bandra", 19.0517, 72.8205, "dry", 240, 45],
  ["Juhu Beach Entrance", "Juhu", 19.0988, 72.8265, "plastic", 360, 91],
  ["Andheri Station West", "Andheri", 19.1197, 72.8464, "wet", 480, 74],
  ["Andheri SEEPZ Gate", "Andheri", 19.1285, 72.8765, "e_waste", 120, 52],
  ["Versova Market", "Andheri", 19.1316, 72.8153, "wet", 360, 0, true],
  ["Goregaon Film City Road", "Goregaon", 19.1663, 72.8526, "dry", 240, 38],
  ["Malad Mindspace", "Malad", 19.1808, 72.8387, "paper", 240, 61],
  ["Borivali National Park Gate", "Borivali", 19.2288, 72.8586, "dry", 240, 29],
  ["Kurla Station East", "Kurla", 19.0652, 72.8791, "wet", 480, 85],
  ["BKC Diamond Bourse", "Bandra Kurla", 19.0674, 72.8689, "paper", 360, 48],
  ["Ghatkopar Market", "Ghatkopar", 19.0856, 72.9081, "wet", 480, 77],
  ["Powai Hiranandani", "Powai", 19.1176, 72.9060, "plastic", 240, 36],
  ["Vashi Sector 17", "Vashi", 19.0745, 72.9978, "dry", 360, 55],
  ["Vashi APMC Market", "Vashi", 19.0722, 73.0102, "wet", 600, 92],
  ["Nerul Sector 6", "Nerul", 19.0330, 73.0297, "plastic", 240, 0, true],
  ["Belapur CBD", "Belapur", 19.0176, 73.0386, "e_waste", 120, 63],
];

const now = Date.now();
export const seedBins = (): SmartBin[] =>
  rows.map(([location, area, latitude, longitude, category, capacityLitres, fillPercentage, off], i) => ({
    id: `BIN-${String(1001 + i)}`, location, area, latitude, longitude, category, capacityLitres, fillPercentage,
    sensorStatus: off ? "offline" : "online",
    lastUpdated: new Date(now - (off ? (6 + (i % 5)) * HOUR : (2 + ((i * 7) % 28)) * MIN)).toISOString(),
  }));

export const seedStaff = (): Staff[] => [
  ["Ramesh Patil", "Zone A – Island City"], ["Sunita Jadhav", "Zone A – Island City"], ["Imran Shaikh", "Zone B – Western Suburbs"],
  ["Priya Nair", "Zone B – Western Suburbs"], ["Anil Gaikwad", "Zone C – Eastern Suburbs"], ["Farah Khan", "Zone C – Eastern Suburbs"],
  ["Vikram Deshmukh", "Zone D – Navi Mumbai"], ["Kavita More", "Zone D – Navi Mumbai"],
].map(([name, zone], i) => ({
  id: `STF-${201 + i}`, name, zone, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@smartwaste.example`,
  phone: `+91 98${String(20000000 + i * 137_211).slice(0, 8)}`, active: i !== 5, joinedAt: ago((90 + i * 40) * DAY),
}));

export const seedAlerts = (bins: SmartBin[]): Alert[] => {
  const out: Alert[] = [];
  bins.forEach((b, i) => {
    const mk = (type: Alert["type"], severity: Alert["severity"], message: string, offset: number, resolved = false): void => {
      out.push({ id: `ALR-${3001 + out.length}`, type, severity, status: resolved ? "resolved" : "active", binId: b.id, location: b.location, message, createdAt: ago(offset), ...(resolved ? { resolvedAt: ago(offset - 40 * MIN) } : {}) });
    };
    const s = deriveBinStatus(b);
    if (s === "offline") mk("sensor_disconnected", "warning", `${b.id} stopped reporting`, (3 + (i % 4)) * HOUR);
    else if (b.fillPercentage >= 95) mk("overflow", "critical", `${b.id} is overflowing at ${b.fillPercentage}%`, 25 * MIN);
    else if (b.fillPercentage >= 90) mk("capacity_90", "critical", `${b.id} reached ${b.fillPercentage}% capacity`, (40 + i * 6) * MIN);
    else if (b.fillPercentage >= 75) mk("capacity_75", "warning", `${b.id} reached ${b.fillPercentage}% capacity`, (1 + (i % 3)) * HOUR);
  });
  out.push({ id: `ALR-${3001 + out.length}`, type: "collection_overdue", severity: "warning", status: "active", binId: bins[4]!.id, location: bins[4]!.location, message: "Scheduled pickup is 3 hours overdue", createdAt: ago(90 * MIN) });
  out.push({ id: `ALR-${3001 + out.length}`, type: "capacity_90", severity: "critical", status: "resolved", binId: bins[2]!.id, location: bins[2]!.location, message: "Emptied after earlier alert", createdAt: ago(2 * DAY), resolvedAt: ago(2 * DAY - HOUR) });
  return out;
};

export const seedCollections = (bins: SmartBin[], staff: Staff[]): Collection[] => {
  const list: Collection[] = [];
  const zoneOf = (area: string) => (["Colaba", "Fort", "Churchgate", "Dadar", "Worli", "Lower Parel"].includes(area) ? 0 : ["Vashi", "Nerul", "Belapur"].includes(area) ? 3 : ["Kurla", "Ghatkopar", "Powai", "Bandra Kurla"].includes(area) ? 2 : 1);
  const staffFor = (area: string) => staff.filter((s) => s.zone === ZONES[zoneOf(area)] && s.active)[0];
  const push = (b: SmartBin, status: Collection["status"], when: string, extra: Partial<Collection> = {}): void => {
    const st = status === "pending" ? undefined : staffFor(b.area);
    list.push({ id: `COL-${5001 + list.length}`, binId: b.id, location: b.location, area: b.area, scheduledFor: when, status, ...(st ? { assignedStaffId: st.id } : {}), ...extra });
  };
  bins.filter((b) => b.fillPercentage >= 90).forEach((b, i) => push(b, i % 2 ? "assigned" : "in_progress", ahead(i * HOUR)));
  bins.filter((b) => b.fillPercentage >= 75 && b.fillPercentage < 90).slice(0, 4).forEach((b, i) => push(b, i < 2 ? "pending" : "assigned", ahead((3 + i) * HOUR)));
  bins.slice(0, 14).forEach((b, i) => push(b, i === 9 ? "cancelled" : "completed", ago((i + 1) * 5 * HOUR), i === 9 ? { notes: "Road closed for repairs" } : { completedAt: ago((i + 1) * 5 * HOUR - 30 * MIN), collectedKg: 60 + ((i * 37) % 140) }));
  return list;
};

export const seedReadings = (bin: SmartBin, limit: number): BinReading[] =>
  Array.from({ length: limit }, (_, i) => {
    const back = limit - 1 - i;
    return { id: `${bin.id}-R${i}`, binId: bin.id, fillPercentage: Math.max(2, Math.round(bin.fillPercentage - back * 2.5 + Math.sin(i) * 2)), batteryPercentage: 92 - Math.floor(i / 4), temperatureC: 29 + ((i * 3) % 5), recordedAt: ago(back * HOUR) };
  });
