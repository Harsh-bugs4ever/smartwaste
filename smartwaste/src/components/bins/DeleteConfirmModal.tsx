import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SmartBin } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  bin: SmartBin | null;
  loading?: boolean;
}

export function DeleteConfirmModal({ open, onClose, onConfirm, bin, loading }: Props) {
  if (!bin) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Decommission Smart Bin"
      description="Are you sure you want to remove this bin from the network?"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Bin <strong>{bin.id}</strong> at <strong>{bin.location}</strong> will be permanently deleted along with its active sensor mappings and historical logs.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Confirm Decommission"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
