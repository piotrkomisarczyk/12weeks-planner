import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from "@/types";
import type { GoalFormData, GoalCategory } from "@/types";

interface PlanGoalsFormProps {
  goals: GoalFormData[];
  onChange: (goals: GoalFormData[]) => void;
  errors: Record<string, string>;
}

/**
 * Step 2: Plan Goals Form
 * Allows user to add/remove and configure 1-6 goals
 */
export function PlanGoalsForm({ goals, onChange, errors }: PlanGoalsFormProps) {
  const handleAddGoal = () => {
    if (goals.length >= 6) return;

    const newGoal: GoalFormData = {
      id: crypto.randomUUID(),
      title: "",
      category: "development",
      description: "",
    };

    onChange([...goals, newGoal]);
  };

  const handleRemoveGoal = (id: string) => {
    if (goals.length <= 1) return;
    onChange(goals.filter((goal) => goal.id !== id));
  };

  const handleGoalChange = (id: string, field: keyof GoalFormData, value: string) => {
    onChange(goals.map((goal) => (goal.id === id ? { ...goal, [field]: value } : goal)));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Long-Term Goals</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Define 1 to 6 long-term goals you want to achieve during this 12-week period. Each goal should be specific and
          meaningful.
        </p>

        {/* General error */}
        {errors["goals"] && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errors["goals"]}</p>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <div key={goal.id} className="relative space-y-4 rounded-md border bg-muted/30 p-4">
              {/* Goal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Goal {index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveGoal(goal.id)}
                  disabled={goals.length <= 1}
                  aria-label={`Remove goal ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Goal Title */}
              <div className="space-y-2">
                <Label htmlFor={`goal-title-${goal.id}`}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`goal-title-${goal.id}`}
                  type="text"
                  value={goal.title}
                  onChange={(e) => handleGoalChange(goal.id, "title", e.target.value)}
                  maxLength={255}
                  placeholder="e.g., Launch new product"
                  aria-invalid={!!errors[`goals.${index}.title`]}
                  aria-describedby={errors[`goals.${index}.title`] ? `goal-title-error-${goal.id}` : undefined}
                />
                {errors[`goals.${index}.title`] && (
                  <p id={`goal-title-error-${goal.id}`} className="text-sm text-destructive">
                    {errors[`goals.${index}.title`]}
                  </p>
                )}
              </div>

              {/* Goal Category */}
              <div className="space-y-2">
                <Label htmlFor={`goal-category-${goal.id}`}>Category</Label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id={`goal-category-${goal.id}`}
                      variant="outline"
                      className="w-full justify-between"
                      type="button"
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[goal.category]}`}
                      >
                        {GOAL_CATEGORIES.find((cat) => cat.value === goal.category)?.label}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                    <DropdownMenuRadioGroup
                      value={goal.category}
                      onValueChange={(value) => handleGoalChange(goal.id, "category", value as GoalCategory)}
                    >
                      {GOAL_CATEGORIES.map((cat) => (
                        <DropdownMenuRadioItem key={cat.value} value={cat.value}>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[cat.value]}`}
                          >
                            {cat.label}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Goal Description */}
              <div className="space-y-2">
                <Label htmlFor={`goal-description-${goal.id}`}>
                  Description (Why do you want to achieve this goal?){" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id={`goal-description-${goal.id}`}
                  type="text"
                  value={goal.description}
                  onChange={(e) => handleGoalChange(goal.id, "description", e.target.value)}
                  placeholder="Add details about why is it important for you"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Goal Button */}
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddGoal}
            disabled={goals.length >= 6}
            className="w-full"
          >
            <Plus className="size-4" />
            Add Goal {goals.length < 6 && `(${goals.length}/6)`}
          </Button>
          {goals.length >= 6 && (
            <p className="text-muted-foreground mt-2 text-xs">
              Maximum of 6 goals reached. Remove a goal to add another.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
