/**
 * GoalsManager Component
 * Main container for goals management view
 * Manages goal list display and creation
 */

import { ArrowLeft } from 'lucide-react';
import { useGoals } from './hooks/useGoals';
import { GoalCard } from './GoalCard';
import { CreateGoalDialog } from './CreateGoalDialog';
import { EmptyState } from './EmptyState';
import { toast } from 'sonner';
import type { PlanContext, PlanStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { isPlanReadOnly } from '@/lib/utils';

interface GoalsManagerProps {
  planContext: PlanContext;
}

/**
 * Main container component for goals management
 * Displays list of goals and allows adding new goals
 * 
 * @param planContext - Plan metadata for validation and display
 */
export default function GoalsManager({ planContext }: GoalsManagerProps) {
  const { goals, isLoading, error, addGoal, updateGoal, deleteGoal, moveGoalUp, moveGoalDown, canAddGoal } = useGoals(planContext.id);

  // Compute flags from plan status
  const isReadOnly = isPlanReadOnly(planContext.status as PlanStatus);

  const handleAddGoal = async (data: {
    title: string;
    category: any;
    description: string | null;
    progress_percentage: number;
    position: number;
  }) => {
    try {
      await addGoal(data);
    } catch (error) {
      // Error is handled by the hook and dialog
      throw error;
    }
  };

  const handleUpdateGoal = async (id: string, data: any) => {
    try {
      await updateGoal(id, data);
    } catch (error) {
      toast.error('Failed to update goal');
      throw error;
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      toast.success('Goal deleted');
    } catch (error) {
      toast.error('Failed to delete goal');
      throw error;
    }
  };

  const handleMoveGoalUp = async (id: string) => {
    try {
      await moveGoalUp(id);
    } catch (error) {
      toast.error('Failed to move goal up');
      console.error(error);
    }
  };

  const handleMoveGoalDown = async (id: string) => {
    try {
      await moveGoalDown(id);
    } catch (error) {
      toast.error('Failed to move goal down');
      console.error(error);
    }
  };

  // Loading State
  if (isLoading && goals.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && goals.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <p className="text-destructive font-semibold">Error loading goals</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    
      {/* Goals Section */}
      <div className="space-y-6">
        {/* <div className="flex items-center justify-between"> */}
        <Card className="rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Long-Term Goals</h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {goals.length} of 6 goals created
                </div>
              </div>

              {goals.length > 0 && (
                <CreateGoalDialog
                  onCreateGoal={handleAddGoal}
                  disabled={isReadOnly}
                  currentGoalsCount={goals.length}
                />
              )}
            </div>
          </CardContent>
        </Card>
        {/* </div> */}

        {/* Empty State */}
        {goals.length === 0 ? (
          <EmptyState
            onCreateGoal={handleAddGoal}
            currentGoalsCount={goals.length}
            disabled={isReadOnly}
          />
        ) : (
          /* Goals List */
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                planContext={planContext}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
                onMoveUp={handleMoveGoalUp}
                onMoveDown={handleMoveGoalDown}
                isFirst={index === 0}
                isLast={index === goals.length - 1}
              />
            ))}
          </div>
        )}

        {/* Max Goals Message */}
        {!canAddGoal && goals.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Maximum of 6 goals reached. Delete a goal to add another.
          </p>
        )}
      </div>

    </div>
  );
}

