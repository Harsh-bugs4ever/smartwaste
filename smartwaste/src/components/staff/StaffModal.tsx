import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/common/FormField";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ZONES } from "@/services/mock/seed";
import type { Staff } from "@/types";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid municipal email is required"),
  phone: z.string().min(10, "Valid contact phone number required"),
  zone: z.string().min(2, "Zone selection is required"),
});

type FormData = z.infer<typeof staffSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Staff | null;
}

export function StaffModal({ open, onClose, onSubmit, initialData }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "+91 ",
      zone: ZONES[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        zone: initialData.zone,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "+91 98",
        zone: ZONES[0],
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
      title={initialData ? `Edit Personnel: ${initialData.name}` : "Register Collection Worker"}
      description="Add field collection driver or municipal technician to the dispatch roster."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          label="Full Name"
          placeholder="e.g. Rajesh Kumar"
          error={errors.name}
          {...register("name")}
        />

        <FormField
          label="Email Address"
          type="email"
          placeholder="e.g. rajesh.kumar@smartwaste.example"
          error={errors.email}
          {...register("email")}
        />

        <FormField
          label="Phone Number"
          placeholder="+91 98200 12345"
          error={errors.phone}
          {...register("phone")}
        />

        <Select label="Assigned Municipal Zone" error={errors.zone?.message} {...register("zone")}>
          {ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </Select>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initialData ? "Update Staff" : "Add Personnel"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
