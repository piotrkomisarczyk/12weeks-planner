import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GoalFormDialog } from "./GoalFormDialog";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from "@/types";
import { formatTextWithLineBreaks } from "@/lib/utils";
import type { GoalDTO, GoalCategory, CreateGoalCommand, UpdateGoalCommand } from "@/types";

interface GoalsStepProps {
  goals: GoalDTO[];
  onAddGoal: (goal: CreateGoalCommand) => Promise<void>;
  onUpdateGoal: (id: string, goal: UpdateGoalCommand) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

/**
 * Goals Step for Edit Plan View
 * Displays existing goals with edit/delete actions and add goal functionality
 */
export function GoalsStep({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }: GoalsStepProps) {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const canAddGoal = goals.length < 6;

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowGoalDialog(true);
  };

  const handleEditGoal = (goal: GoalDTO) => {
    setEditingGoal(goal);
    setShowGoalDialog(true);
  };

  const handleGoalSubmit = async (data: CreateGoalCommand | UpdateGoalCommand) => {
    if (editingGoal) {
      // Update existing goal
      await onUpdateGoal(editingGoal.id, data as UpdateGoalCommand);
    } else {
      // Create new goal
      await onAddGoal({
        ...data,
        plan_id: goals[0]?.plan_id || "", // Use plan_id from existing goals
        position: goals.length + 1,
      } as CreateGoalCommand);
    }
    setShowGoalDialog(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoalId) return;

    await onDeleteGoal(deletingGoalId);
    setDeletingGoalId(null);
  };

  const getCategoryInfo = (category: GoalCategory | null) => {
    if (!category) return null;
    const catInfo = GOAL_CATEGORIES.find((c) => c.value === category);
    return catInfo ? { label: catInfo.label, color: GOAL_CATEGORY_COLORS[category] } : null;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Long-Term Goals</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Manage your long-term goals. You can add up to 6 goals total.
        </p>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No goals yet. Add your first goal to get started.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const categoryInfo = getCategoryInfo(goal.category as GoalCategory);
              return (
                <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium truncate">{goal.title}</h3>
                      {categoryInfo && <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>}
                    </div>
                    {goal.description && (
                      <p
                        className="text-sm text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: formatTextWithLineBreaks(goal.description) }}
                      />
                    )}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{goal.progress_percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditGoal(goal)}
                      aria-label={`Edit goal: ${goal.title}`}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingGoalId(goal.id)}
                      aria-label={`Delete goal: ${goal.title}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Goal Button */}
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={handleAddGoal} disabled={!canAddGoal} className="w-full">
            <Plus className="size-4" />
            Add Goal {goals.length < 6 && `(${goals.length}/6)`}
          </Button>
          {!canAddGoal && (
            <p className="text-muted-foreground mt-2 text-xs">Maximum 6 goals reached. Delete a goal to add another.</p>
          )}
        </div>
      </div>

      {/* Goal Form Dialog */}
      <GoalFormDialog
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
        goal={editingGoal}
        onSubmit={handleGoalSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGoalId} onOpenChange={() => setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
