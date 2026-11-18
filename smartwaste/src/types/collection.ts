export type CollectionStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
export interface Collection {
  id: string; binId: string; location: string; area: string; scheduledFor: string; status: CollectionStatus;
  assignedStaffId?: string; completedAt?: string; collectedKg?: number; notes?: string;
}
export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  pending: "Pending", assigned: "Assigned", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
