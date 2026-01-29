import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from "@/types";
import type { GoalDTO, GoalCategory, CreateGoalCommand, UpdateGoalCommand } from "@/types";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalDTO | null;
  onSubmit: (data: CreateGoalCommand | UpdateGoalCommand) => Promise<void>;
}

/**
 * Goal Form Dialog for creating and editing goals
 */
export function GoalFormDialog({ open, onOpenChange, goal, onSubmit }: GoalFormDialogProps) {
  const isEditing = !!goal;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "development" as GoalCategory,
    description: "",
    progress_percentage: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or goal changes
  useEffect(() => {
    if (open) {
      if (goal) {
        // Editing existing goal
        setFormData({
          title: goal.title,
          category: (goal.category as GoalCategory) || "development",
          description: goal.description || "",
          progress_percentage: goal.progress_percentage,
        });
      } else {
        // Creating new goal
        setFormData({
          title: "",
          category: "development",
          description: "",
          progress_percentage: 0,
        });
      }
      setErrors({});
    }
  }, [open, goal]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (formData.title.length > 255) {
      newErrors.title = "Title must be less than 255 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        progress_percentage: formData.progress_percentage,
        ...(isEditing ? {} : { position: 1 }), // Position will be set by parent for new goals
      });
    } catch (error) {
      // Error handling is done by parent component
      console.error("Failed to save goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "Add New Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your goal details below." : "Create a new long-term goal for your 12-week plan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="goal-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Launch new product"
              maxLength={255}
              className="w-full"
              aria-invalid={!!errors.title}
              autoFocus
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="goal-category">Category</Label>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button id="goal-category" variant="outline" className="w-full justify-between" type="button">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 ${GOAL_CATEGORY_COLORS[formData.category]}`}
                  >
                    {GOAL_CATEGORIES.find((cat) => cat.value === formData.category)?.label}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                <DropdownMenuRadioGroup
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as GoalCategory })}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="goal-description">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <div className="overflow-hidden rounded-md border">
              <Textarea
                id="goal-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Why is this goal important to you?"
                className="w-full border-0 focus:ring-0 focus:ring-offset-0 resize-none"
                rows={4}
                style={{
                  minHeight: "80px",
                  maxHeight: "120px",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              />
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="space-y-2">
            <Label htmlFor="goal-progress">Progress: {formData.progress_percentage}%</Label>
            <Slider
              id="goal-progress"
              min={0}
              max={100}
              step={1}
              value={[formData.progress_percentage]}
              onValueChange={(value) => setFormData({ ...formData, progress_percentage: value[0] })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Set the current progress percentage for this goal.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
