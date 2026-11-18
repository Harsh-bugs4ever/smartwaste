import type { WasteCategory } from "./bin";
export interface TrendPoint { label: string; collectedKg: number; collections: number }
export interface SegregationSlice { category: WasteCategory; kg: number }
export interface AreaStat { area: string; kg: number; overflowIncidents: number }
export interface MonthlyPerformance { month: string; scheduled: number; completed: number }
export type TrendPeriod = "daily" | "weekly" | "monthly";
export interface WasteStatistics {
  totalBins: number; activeBins: number; offlineBins: number; criticalBins: number;
  pendingCollections: number; completedCollections: number; averageFillPercentage: number;
  segregationEfficiency: number;
  segregation: SegregationSlice[]; areas: AreaStat[]; monthly: MonthlyPerformance[];
}
