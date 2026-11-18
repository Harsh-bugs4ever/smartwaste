import { seedAlerts, seedBins, seedCollections, seedStaff } from "./seed";
const bins = seedBins();
const staff = seedStaff();
export const db = { bins, staff, alerts: seedAlerts(bins), collections: seedCollections(bins, staff) };
export const delay = <T,>(value: T, ms = 220): Promise<T> => new Promise((r) => setTimeout(() => r(structuredClone(value)), ms));
export const nextId = (prefix: string, items: { id: string }[], start: number): string =>
  `${prefix}-${Math.max(start - 1, ...items.map((i) => Number(i.id.split("-")[1]) || 0)) + 1}`;
