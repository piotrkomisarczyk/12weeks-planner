import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isMonday } from "@/lib/plan-utils";
import type { CreatePlanCommand } from "@/types";

// Validation schema
const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  start_date: z.string().refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return isMonday(date);
    },
    { message: "Start date must be a Monday" }
  ),
});

interface CreatePlanDialogProps {
  onCreatePlan: (data: CreatePlanCommand) => Promise<void>;
  trigger?: React.ReactNode;
}

export function CreatePlanDialog({ onCreatePlan, trigger }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the next Monday as default date suggestion
  const getNextMonday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = createPlanSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreatePlan(result.data);
      // Reset form and close dialog on success
      setFormData({ name: "", start_date: "" });
      setOpen(false);
    } catch (error) {
      // Error handling is done in the parent component (toast notification)
      console.error("Failed to create plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      setFormData({ name: "", start_date: getNextMonday() });
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || <Button>Create New Plan</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New 12-Week Plan</DialogTitle>
          <DialogDescription>
            Set up a new 12-week plan to track your long-term goals. The plan must start on a Monday.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="plan-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Plan Name
            </label>
            <input
              id="plan-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="e.g., Q1 2024 Goals"
              aria-invalid={!!errors.name}
              maxLength={255}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="start-date"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Start Date (Monday)
            </label>
            <input
              id="start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              aria-invalid={!!errors.start_date}
              aria-describedby={errors.start_date ? "date-error" : undefined}
            />
            {errors.start_date && (
              <p id="date-error" className="text-sm text-destructive">
                {errors.start_date}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Please select a Monday as the start date for your 12-week plan.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
