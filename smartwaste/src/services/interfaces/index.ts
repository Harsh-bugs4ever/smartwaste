import type { Alert, AlertStatus, Collection, CollectionStatus, NewBin, SmartBin, BinReading, Staff, TrendPeriod, TrendPoint, User, UserRole, WasteStatistics } from "@/types";

export interface BinService {
  list(): Promise<SmartBin[]>;
  get(id: string): Promise<SmartBin | null>;
  create(input: NewBin): Promise<SmartBin>;
  update(id: string, patch: Partial<Omit<SmartBin, "id">>): Promise<SmartBin>;
  remove(id: string): Promise<void>;
  readings(binId: string, limit?: number): Promise<BinReading[]>;
}
export interface AlertService {
  list(filter?: { status?: AlertStatus }): Promise<Alert[]>;
  resolve(id: string): Promise<Alert>;
}
export interface CollectionService {
  list(): Promise<Collection[]>;
  create(input: Pick<Collection, "binId" | "scheduledFor"> & { assignedStaffId?: string; notes?: string }): Promise<Collection>;
  assign(id: string, staffId: string): Promise<Collection>;
  setStatus(id: string, status: CollectionStatus, collectedKg?: number): Promise<Collection>;
}
export interface StaffService {
  list(): Promise<Staff[]>;
  create(input: Omit<Staff, "id" | "joinedAt" | "active">): Promise<Staff>;
  update(id: string, patch: Partial<Omit<Staff, "id">>): Promise<Staff>;
}
export interface StatsService {
  overview(): Promise<WasteStatistics>;
  trend(period: TrendPeriod): Promise<TrendPoint[]>;
}

export interface Session { user: User }
/** Real auth is delegated to Supabase Auth. The mock implementation is demo-only and says so in the UI. */
export interface AuthService {
  readonly isDemo: boolean;
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Session>;
  signUp(input: { name: string; email: string; password: string }): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Demo mode only: enter the app as a given role. Supabase implementation throws. */
  enterDemo?(role: UserRole): Promise<Session>;
}
