import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import type { GoalFormData, GoalCategory } from '@/types';

interface PlanGoalsFormProps {
  goals: GoalFormData[];
  onChange: (goals: GoalFormData[]) => void;
  errors: Record<string, string>;
}

/**
 * Step 2: Plan Goals Form
 * Allows user to add/remove and configure 1-5 goals
 */
export function PlanGoalsForm({ goals, onChange, errors }: PlanGoalsFormProps) {
  const handleAddGoal = () => {
    if (goals.length >= 5) return;

    const newGoal: GoalFormData = {
      id: crypto.randomUUID(),
      title: '',
      category: 'development',
      description: '',
    };

    onChange([...goals, newGoal]);
  };

  const handleRemoveGoal = (id: string) => {
    if (goals.length <= 1) return;
    onChange(goals.filter((goal) => goal.id !== id));
  };

  const handleGoalChange = (id: string, field: keyof GoalFormData, value: string) => {
    onChange(
      goals.map((goal) =>
        goal.id === id ? { ...goal, [field]: value } : goal
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Long-Term Goals</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Define 1 to 5 long-term goals you want to achieve during this 12-week period.
          Each goal should be specific and meaningful.
        </p>

        {/* General error */}
        {errors['goals'] && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errors['goals']}</p>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <div
              key={goal.id}
              className="relative space-y-4 rounded-md border bg-muted/30 p-4"
            >
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
                  onChange={(e) =>
                    handleGoalChange(goal.id, 'title', e.target.value)
                  }
                  placeholder="e.g., Launch new product"
                  aria-invalid={!!errors[`goals.${index}.title`]}
                  aria-describedby={
                    errors[`goals.${index}.title`]
                      ? `goal-title-error-${goal.id}`
                      : undefined
                  }
                />
                {errors[`goals.${index}.title`] && (
                  <p
                    id={`goal-title-error-${goal.id}`}
                    className="text-sm text-destructive"
                  >
                    {errors[`goals.${index}.title`]}
                  </p>
                )}
              </div>

              {/* Goal Category */}
              <div className="space-y-2">
                <Label htmlFor={`goal-category-${goal.id}`}>Category</Label>
                <Select
                  value={goal.category}
                  onValueChange={(value) =>
                    handleGoalChange(goal.id, 'category', value as GoalCategory)
                  }
                >
                  <SelectTrigger
                    id={`goal-category-${goal.id}`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[cat.value]}`}
                        >
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Goal Description */}
              <div className="space-y-2">
                <Label htmlFor={`goal-description-${goal.id}`}>
                  Description (Why do you want to achieve this goal?) <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id={`goal-description-${goal.id}`}
                  type="text"
                  value={goal.description}
                  onChange={(e) =>
                    handleGoalChange(goal.id, 'description', e.target.value)
                  }
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
            disabled={goals.length >= 5}
            className="w-full"
          >
            <Plus className="size-4" />
            Add Goal {goals.length < 5 && `(${goals.length}/5)`}
          </Button>
          {goals.length >= 5 && (
            <p className="text-muted-foreground mt-2 text-xs">
              Maximum of 5 goals reached. Remove a goal to add another.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

