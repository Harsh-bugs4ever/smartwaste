export type WasteCategory = "wet" | "dry" | "plastic" | "paper" | "e_waste";
export type BinStatus = "normal" | "warning" | "critical" | "offline";
export type SensorStatus = "online" | "offline";
export interface SmartBin {
  id: string; location: string; area: string; latitude: number; longitude: number;
  category: WasteCategory; capacityLitres: number; fillPercentage: number;
  sensorStatus: SensorStatus; lastUpdated: string; // ISO
}
export interface BinReading { id: string; binId: string; fillPercentage: number; batteryPercentage: number; temperatureC: number; recordedAt: string }
export type NewBin = Omit<SmartBin, "id" | "lastUpdated" | "fillPercentage" | "sensorStatus"> & Partial<Pick<SmartBin, "fillPercentage" | "sensorStatus">>;
export const CATEGORY_LABELS: Record<WasteCategory, string> = { wet: "Wet waste", dry: "Dry waste", plastic: "Plastic", paper: "Paper", e_waste: "E-waste" };
