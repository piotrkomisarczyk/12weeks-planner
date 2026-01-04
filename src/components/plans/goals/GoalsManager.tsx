/**
 * GoalsManager Component
 * Main container for goals management view
 * Manages goal list display and creation
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGoals } from './hooks/useGoals';
import { GoalCard } from './GoalCard';
import { CreateGoalDialog } from './CreateGoalDialog';
import { EmptyState } from './EmptyState';
import { toast } from 'sonner';
import type { PlanContext } from './types';

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
  const { goals, isLoading, error, addGoal, updateGoal, deleteGoal, canAddGoal } = useGoals(planContext.id);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleAddGoal = async (data: {
    title: string;
    category: any;
    description: string | null;
    progress_percentage: number;
    position: number;
  }) => {
    try {
      await addGoal(data);
      setCreateDialogOpen(false);
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

  // Loading State
  if (isLoading && goals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">{planContext.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {new Date(planContext.startDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                {' '}-{' '}
                {new Date(planContext.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              {planContext.isArchived && (
                <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                  Archived
                </span>
              )}
            </div>
          </div>
          <a 
            href="/plans" 
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Plans
          </a>
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Long-Term Goals</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {goals.length} of 5 goals created
            </p>
          </div>
          
          {goals.length > 0 && (
            <CreateGoalDialog
              onCreateGoal={handleAddGoal}
              disabled={planContext.isArchived}
              currentGoalsCount={goals.length}
            />
          )}
        </div>

        {/* Empty State */}
        {goals.length === 0 ? (
          <EmptyState
            onAddGoal={() => setCreateDialogOpen(true)}
            disabled={planContext.isArchived}
          />
        ) : (
          /* Goals List */
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                planContext={planContext}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}

        {/* Max Goals Message */}
        {!canAddGoal && goals.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Maximum of 5 goals reached. Delete a goal to add another.
          </p>
        )}
      </div>

      {/* Hidden dialog trigger for empty state */}
      {goals.length === 0 && (
        <div className="hidden">
          <CreateGoalDialog
            onCreateGoal={handleAddGoal}
            disabled={planContext.isArchived}
            currentGoalsCount={goals.length}
          />
        </div>
      )}
    </div>
  );
}

