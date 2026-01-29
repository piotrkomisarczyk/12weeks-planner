/**
 * CreateWeeklyGoalDialog Component
 *
 * Dialog for creating a new weekly goal with optional link to long-term goal.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SimpleGoal } from "@/types";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from "@/types";

interface CreateWeeklyGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, longTermGoalId?: string) => void;
  availableLongTermGoals: SimpleGoal[];
}

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find((cat) => cat.value === category);
  return categoryItem?.label || category;
};

export function CreateWeeklyGoalDialog({
  open,
  onOpenChange,
  onSubmit,
  availableLongTermGoals,
}: CreateWeeklyGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("__none__");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    // Convert __none__ sentinel value to undefined
    const goalId = selectedGoalId === "__none__" ? undefined : selectedGoalId;
    onSubmit(title.trim(), goalId);

    // Reset form
    setTitle("");
    setSelectedGoalId("__none__");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setTitle("");
      setSelectedGoalId("__none__");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-test-id="create-weekly-goal-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Weekly Goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Goal Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complete authentication module"
                maxLength={255}
                required
                autoFocus
                data-test-id="weekly-goal-title-input"
              />
            </div>

            {/* Long-term Goal Selection */}
            <div className="space-y-2">
              <Label htmlFor="long-term-goal">
                Link to Long-term Goal <span className="text-muted-foreground text-sm">(optional)</span>
              </Label>
              {availableLongTermGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No long-term goals available. Create goals in the Goals view first.
                </p>
              ) : (
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger id="long-term-goal" data-test-id="weekly-goal-longterm-select">
                    <SelectValue placeholder="Select a long-term goal (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" data-test-id="longterm-goal-option-none">
                      None
                    </SelectItem>
                    {availableLongTermGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id} data-test-id={`longterm-goal-option-${goal.title}`}>
                        <div className="flex items-center gap-2">
                          <Badge className={GOAL_CATEGORY_COLORS[goal.category] || "bg-gray-500 text-white"}>
                            {getCategoryLabel(goal.category)}
                          </Badge>
                          <span>{goal.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-test-id="create-weekly-goal-cancel-button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} data-test-id="create-weekly-goal-submit-button">
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
