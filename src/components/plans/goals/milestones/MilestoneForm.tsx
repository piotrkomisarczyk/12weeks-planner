/**
 * MilestoneForm Component
 * Form for adding new milestones with date validation
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, normalizeDateToMidnight } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface MilestoneFormProps {
  onAdd: (data: { title: string; due_date: string | null; position: number }) => Promise<void>;
  planStartDate: string;
  planEndDate: string;
  currentMilestonesCount: number;
  disabled?: boolean;
}

/**
 * Form for adding a new milestone
 * Validates that due date is within plan date range
 */
export function MilestoneForm({
  onAdd,
  planStartDate,
  planEndDate,
  currentMilestonesCount,
  disabled = false,
}: MilestoneFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState(false);

  const canAddMilestone = currentMilestonesCount < 5;

  const minDate = new Date(planStartDate);
  const maxDate = new Date(planEndDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
    if (isSubmitting) return;

    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    // Check milestone limit
    if (currentMilestonesCount >= 5) {
      setError("Maximum 5 milestones reached");
      return;
    }

    // Date validation
    if (dueDate) {
      if (dueDate < minDate || dueDate > maxDate) {
        setError("Date must be within plan duration");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        title: title.trim(),
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        position: currentMilestonesCount + 1,
      });

      // Reset form
      setTitle("");
      setDueDate(undefined);
      setError("");
    } catch (err) {
      // Keep the form data so user can correct the issue
      // Don't reset title field on validation errors
      const errorMessage = err instanceof Error ? err.message : "Failed to add milestone";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAddMilestone) {
    return <p className="text-sm text-muted-foreground">Maximum of 5 milestones reached</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 p-1">
        {/* Title Input */}
        <div className="flex-1">
          <Label htmlFor="milestone-title" className="sr-only">
            Milestone Title
          </Label>
          <Input
            id="milestone-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add milestone..."
            disabled={disabled || isSubmitting}
            className="h-9"
            maxLength={255}
          />
        </div>

        {/* Date Picker */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isSubmitting}
              className={cn("h-9 w-[140px] justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 size-4" />
              {dueDate ? format(dueDate, "MMM dd, yyyy") : "Due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                setDueDate(date);
                setShowCalendar(false);
              }}
              disabled={(date) => {
                const normalizedDate = normalizeDateToMidnight(date);
                return normalizedDate < minDate || normalizedDate > maxDate;
              }}
              weekStartsOn={1}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Add Button */}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isSubmitting || !title.trim()}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="size-4" />
          <span className="sr-only">Add milestone</span>
        </Button>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
