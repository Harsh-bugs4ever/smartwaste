import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useBins, useStaff } from "@/hooks/useData";

const collectionSchema = z.object({
  binId: z.string().min(1, "Please select a target smart bin"),
  scheduledFor: z.string().min(1, "Scheduled date/time is required"),
  assignedStaffId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof collectionSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  defaultBinId?: string;
}

export function CreateCollectionModal({ open, onClose, onSubmit, defaultBinId }: Props) {
  const { data: bins } = useBins();
  const { data: staff } = useStaff();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      binId: defaultBinId || "",
      scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
      assignedStaffId: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (defaultBinId) {
      reset({
        binId: defaultBinId,
        scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
        assignedStaffId: "",
        notes: "",
      });
    }
  }, [defaultBinId, reset, open]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      scheduledFor: new Date(data.scheduledFor).toISOString(),
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Dispatch Waste Collection Run"
      description="Schedule a waste pickup route, allocate collection staff, and set priority."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Select label="Target Smart Bin" error={errors.binId?.message} {...register("binId")}>
          <option value="">-- Choose Target Bin --</option>
          {(bins || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} – {b.location} ({b.fillPercentage}% full)
            </option>
          ))}
        </Select>

        <FormField
          label="Scheduled Pickup Date & Time"
          type="datetime-local"
          error={errors.scheduledFor}
          {...register("scheduledFor")}
        />

        <Select
          label="Assign Field Worker (Optional)"
          error={errors.assignedStaffId?.message}
          {...register("assignedStaffId")}
        >
          <option value="">-- Auto-assign or Unassigned --</option>
          {(staff || [])
            .filter((s) => s.active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.zone})
              </option>
            ))}
        </Select>

        <FormField
          label="Route Notes / Instructions"
          placeholder="e.g. Heavy commercial morning traffic, rear gate access."
          error={errors.notes}
          {...register("notes")}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Dispatching…" : "Schedule Pickup"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
