/**
 * CreateGoalDialog Component
 * Modal dialog for creating a new goal
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import type { GoalCategory } from '@/types';

interface CreateGoalDialogProps {
  onCreateGoal: (data: {
    title: string;
    category: GoalCategory | null;
    description: string | null;
    progress_percentage: number;
    position: number;
  }) => Promise<void>;
  disabled?: boolean;
  currentGoalsCount: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

/**
 * Dialog for creating a new goal
 * Similar to wizard goal form but in a modal
 */
export function CreateGoalDialog({
  onCreateGoal,
  disabled,
  currentGoalsCount,
  open,
  onOpenChange,
  showTrigger = true,
}: CreateGoalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'development' as GoalCategory,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAddGoal = currentGoalsCount < 6;
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  const setDialogOpen = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(nextOpen);
        return;
      }

      setInternalOpen(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onCreateGoal({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        progress_percentage: 0,
        position: currentGoalsCount + 1,
      });

      toast.success('Goal created successfully');
      
      // Reset form and close dialog
      setFormData({
        title: '',
        category: 'development',
        description: '',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button disabled={!canAddGoal || disabled}>
            <Plus className="size-4" />
            Add Goal
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Create a new long-term goal for your 12-week plan. You can add up to 6 goals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="new-goal-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-goal-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Launch new product"
              maxLength={255}
              aria-invalid={!!errors.title}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="new-goal-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as GoalCategory })
              }
            >
              <SelectTrigger id="new-goal-category">
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="new-goal-description">
              Why is it important? How will you measure your success?
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="new-goal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why? Success Criteria?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

