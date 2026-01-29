import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface PlanDetailsStepProps {
  name: string;
  startDate: string;
  onNameChange: (value: string) => void;
  errors: Record<string, string>;
}

/**
 * Edit Plan Details Step
 * Allows editing the plan name, displays read-only start date
 */
export function PlanDetailsStep({ name, startDate, onNameChange, errors }: PlanDetailsStepProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Plan Details</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Update your plan name. The start date is fixed and cannot be changed.
        </p>

        <div className="space-y-4">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="plan-name">
              Plan Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-name"
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., Q1 2026 Goals"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "plan-name-error" : undefined}
              maxLength={255}
            />
            {errors.name && (
              <p id="plan-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Give your plan a memorable name to identify this 12-week cycle.
            </p>
          </div>

          {/* Start Date - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <div className="flex items-center space-x-2 rounded-md border bg-muted px-3 py-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatDate(startDate)}</span>
            </div>
            <p className="text-xs text-muted-foreground">The start date cannot be changed once the plan is created.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
