import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, type SmartBin, type WasteCategory } from "@/types";

const binSchema = z.object({
  location: z.string().min(3, "Location description must be at least 3 characters"),
  area: z.string().min(2, "Zone/Area is required"),
  latitude: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  category: z.enum(["wet", "dry", "plastic", "paper", "e_waste"] as const),
  capacityLitres: z.coerce.number().min(50, "Capacity must be at least 50L").max(2000, "Max 2000L"),
});

type FormData = z.infer<typeof binSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: SmartBin | null;
}

export function BinModal({ open, onClose, onSubmit, initialData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(binSchema),
    defaultValues: {
      location: "",
      area: "Colaba",
      latitude: 18.922,
      longitude: 72.834,
      category: "dry",
      capacityLitres: 240,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        location: initialData.location,
        area: initialData.area,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        category: initialData.category,
        capacityLitres: initialData.capacityLitres,
      });
    } else {
      reset({
        location: "",
        area: "Colaba",
        latitude: 18.922,
        longitude: 72.834,
        category: "dry",
        capacityLitres: 240,
      });
    }
  }, [initialData, reset, open]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initialData ? `Edit Bin ${initialData.id}` : "Register New Smart Bin"}
      description={
        initialData
          ? "Update location, physical specifications or telemetry parameters."
          : "Add an IoT-connected municipal waste receptacle to the monitoring network."
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          label="Location Name"
          placeholder="e.g. Gateway of India Promenade"
          error={errors.location}
          {...register("location")}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Zone / Ward Area"
            placeholder="e.g. Colaba, Bandra"
            error={errors.area}
            {...register("area")}
          />
          <Select
            label="Waste Category"
            error={errors.category?.message}
            {...register("category")}
          >
            {(Object.keys(CATEGORY_LABELS) as WasteCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Latitude"
            type="number"
            step="0.0001"
            placeholder="18.922"
            error={errors.latitude}
            {...register("latitude")}
          />
          <FormField
            label="Longitude"
            type="number"
            step="0.0001"
            placeholder="72.834"
            error={errors.longitude}
            {...register("longitude")}
          />
        </div>

        <FormField
          label="Capacity (Litres)"
          type="number"
          step="10"
          placeholder="240"
          error={errors.capacityLitres}
          {...register("capacityLitres")}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Update Bin" : "Register Bin"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
