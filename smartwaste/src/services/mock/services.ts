import type { AlertService, BinService, CollectionService, StaffService, StatsService } from "../interfaces";
import type { SegregationSlice, WasteCategory } from "@/types";
import { db, delay, nextId } from "./db";
import { seedReadings } from "./seed";
import { deriveBinStatus } from "@/utils/binStatus";

const fail = (m: string): never => { throw new Error(m); };

export const binService: BinService = {
  list: () => delay(db.bins),
  get: (id) => delay(db.bins.find((b) => b.id === id) ?? null),
  async create(input) {
    const bin = { ...input, id: nextId("BIN", db.bins, 1001), fillPercentage: input.fillPercentage ?? 0, sensorStatus: input.sensorStatus ?? "online", lastUpdated: new Date().toISOString() };
    db.bins.push(bin); return delay(bin);
  },
  async update(id, patch) {
    const bin = db.bins.find((b) => b.id === id) ?? fail(`Bin ${id} not found`);
    Object.assign(bin, patch, { lastUpdated: new Date().toISOString() }); return delay(bin);
  },
  async remove(id) {
    const i = db.bins.findIndex((b) => b.id === id); if (i < 0) fail(`Bin ${id} not found`);
    db.bins.splice(i, 1); await delay(null);
  },
  async readings(binId, limit = 24) {
    const bin = db.bins.find((b) => b.id === binId) ?? fail(`Bin ${binId} not found`);
    return delay(seedReadings(bin, limit));
  },
};

export const alertService: AlertService = {
  list: (f) => delay(db.alerts.filter((a) => !f?.status || a.status === f.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  async resolve(id) {
    const a = db.alerts.find((x) => x.id === id) ?? fail(`Alert ${id} not found`);
    a.status = "resolved"; a.resolvedAt = new Date().toISOString(); return delay(a);
  },
};

export const collectionService: CollectionService = {
  list: () => delay([...db.collections].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))),
  async create(input) {
    const bin = db.bins.find((b) => b.id === input.binId) ?? fail(`Bin ${input.binId} not found`);
    const c = { id: nextId("COL", db.collections, 5001), binId: bin.id, location: bin.location, area: bin.area, scheduledFor: input.scheduledFor, status: input.assignedStaffId ? "assigned" as const : "pending" as const, ...(input.assignedStaffId ? { assignedStaffId: input.assignedStaffId } : {}), ...(input.notes ? { notes: input.notes } : {}) };
    db.collections.push(c); return delay(c);
  },
  async assign(id, staffId) {
    const c = db.collections.find((x) => x.id === id) ?? fail(`Collection ${id} not found`);
    c.assignedStaffId = staffId; if (c.status === "pending") c.status = "assigned"; return delay(c);
  },
  async setStatus(id, status, collectedKg) {
    const c = db.collections.find((x) => x.id === id) ?? fail(`Collection ${id} not found`);
    c.status = status;
    if (status === "completed") {
      c.completedAt = new Date().toISOString(); if (collectedKg !== undefined) c.collectedKg = collectedKg;
      const bin = db.bins.find((b) => b.id === c.binId); if (bin) { bin.fillPercentage = 3; bin.lastUpdated = c.completedAt; }
    }
    return delay(c);
  },
};

export const staffService: StaffService = {
  list: () => delay(db.staff),
  async create(input) {
    const s = { ...input, id: nextId("STF", db.staff, 201), active: true, joinedAt: new Date().toISOString() };
    db.staff.push(s); return delay(s);
  },
  async update(id, patch) {
    const s = db.staff.find((x) => x.id === id) ?? fail(`Staff ${id} not found`);
    Object.assign(s, patch); return delay(s);
  },
};

const CATS: WasteCategory[] = ["wet", "dry", "plastic", "paper", "e_waste"];
const SHARE: Record<WasteCategory, number> = { wet: 0.42, dry: 0.24, plastic: 0.17, paper: 0.13, e_waste: 0.04 };
export const statsService: StatsService = {
  async overview() {
    const bins = db.bins;
    const statuses = bins.map(deriveBinStatus);
    const online = bins.filter((b) => b.sensorStatus === "online");
    const totalKg = db.collections.reduce((s, c) => s + (c.collectedKg ?? 0), 0) * 14;
    const segregation: SegregationSlice[] = CATS.map((category) => ({ category, kg: Math.round(totalKg * SHARE[category]) }));
    const areas = [...new Set(bins.map((b) => b.area))].map((area, i) => ({
      area, kg: Math.round(totalKg * (0.02 + ((i * 7) % 11) / 100)), overflowIncidents: bins.filter((b) => b.area === area && b.fillPercentage >= 95).length + (i % 3),
    }));
    const monthly = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((month, i) => ({ month, scheduled: 310 + i * 14, completed: 280 + i * 17 }));
    return delay({
      totalBins: bins.length, activeBins: online.length, offlineBins: bins.length - online.length,
      criticalBins: statuses.filter((s) => s === "critical").length,
      pendingCollections: db.collections.filter((c) => ["pending", "assigned", "in_progress"].includes(c.status)).length,
      completedCollections: db.collections.filter((c) => c.status === "completed").length,
      averageFillPercentage: Math.round(online.reduce((s, b) => s + b.fillPercentage, 0) / Math.max(1, online.length)),
      segregationEfficiency: 78, segregation, areas, monthly,
    });
  },
  async trend(period) {
    const cfg = { daily: { n: 14, f: (i: number) => `${i + 1} Nov` }, weekly: { n: 10, f: (i: number) => `W${i + 1}` }, monthly: { n: 12, f: (i: number) => ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][i]! } }[period];
    const scale = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
    return delay(Array.from({ length: cfg.n }, (_, i) => ({ label: cfg.f(i), collectedKg: Math.round((1800 + Math.sin(i / 2) * 260 + i * 22) * scale), collections: Math.round((46 + Math.cos(i / 3) * 6 + i) * scale) })));
  },
};
