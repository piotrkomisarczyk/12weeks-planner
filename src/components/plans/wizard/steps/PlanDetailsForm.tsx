import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '../DatePicker';
import type { PlanDetailsData } from '@/types';

interface PlanDetailsFormProps {
  data: PlanDetailsData;
  onChange: (data: PlanDetailsData) => void;
  errors: Record<string, string>;
}

/**
 * Step 1: Plan Details Form
 * Collects plan name and start date
 */
export function PlanDetailsForm({ data, onChange, errors }: PlanDetailsFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...data,
      name: e.target.value,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    onChange({
      ...data,
      startDate: date,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Plan Details</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Set a name for your 12-week plan and choose when it should start. The plan must
          start on a Monday.
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
              value={data.name}
              onChange={handleNameChange}
              placeholder="e.g., Q1 2026 Goals"
              maxLength={255}
              aria-invalid={!!errors['details.name']}
              aria-describedby={
                errors['details.name'] ? 'plan-name-error' : undefined
              }
            />
            {errors['details.name'] && (
              <p id="plan-name-error" className="text-sm text-destructive">
                {errors['details.name']}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Give your plan a memorable name to identify this 12-week cycle.
            </p>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={data.startDate}
              onChange={handleDateChange}
              error={errors['details.startDate']}
            />
            {errors['details.startDate'] && (
              <p id="start-date-error" className="text-sm text-destructive">
                {errors['details.startDate']}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Select a Monday as the start date for your 12-week plan. Only Mondays can
              be selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

