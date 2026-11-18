export type UserRole = "super_admin" | "municipal_admin" | "collection_staff";
export interface User { id: string; name: string; email: string; role: UserRole; avatarUrl?: string }
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin", municipal_admin: "Municipal Administrator", collection_staff: "Collection Staff",
};
