import { services } from "@/services";
import { useAsync } from "./useAsync";
import type { TrendPeriod } from "@/types";
export const useBins = () => useAsync(() => services.bins.list());
export const useAlerts = () => useAsync(() => services.alerts.list());
export const useCollections = () => useAsync(() => services.collections.list());
export const useStaff = () => useAsync(() => services.staff.list());
export const useStats = () => useAsync(() => services.stats.overview());
export const useTrend = (p: TrendPeriod) => useAsync(() => services.stats.trend(p), [p]);
