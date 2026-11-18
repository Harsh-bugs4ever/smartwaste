import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

const completeSchema = z.object({
  collectedKg: z.coerce.number().min(1, "Weight must be at least 1 kg").max(5000, "Max 5000 kg"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof completeSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  collection: Collection | null;
  onConfirm: (collectionId: string, collectedKg: number, remarks?: string) => Promise<void>;
}

export function CompleteCollectionModal({ open, onClose, collection, onConfirm }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      collectedKg: 85,
      remarks: "Full empty completed, bin sanitized.",
    },
  });

  if (!collection) return null;

  const handleFormSubmit = async (data: FormData) => {
    await onConfirm(collection.id, data.collectedKg, data.remarks);
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Complete Waste Collection"
      description={`Record pickup completion for ${collection.binId} at ${collection.location}.`}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="p-3 rounded-lg bg-secondary/50 text-xs space-y-1">
          <p>
            <strong>Route Zone:</strong> {collection.area}
          </p>
          <p>
            <strong>Scheduled:</strong> {new Date(collection.scheduledFor).toLocaleString()}
          </p>
          <p className="text-muted-foreground pt-1">
            Marking this run as completed will automatically record the weight and reset the bin's fill telemetry.
          </p>
        </div>

        <FormField
          label="Collected Waste Weight (kg)"
          type="number"
          step="1"
          placeholder="e.g. 75"
          error={errors.collectedKg}
          {...register("collectedKg")}
        />

        <FormField
          label="Closing Notes / Remarks"
          placeholder="Bin condition, liner replaced, etc."
          error={errors.remarks}
          {...register("remarks")}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Finalizing…" : "Complete Collection"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
