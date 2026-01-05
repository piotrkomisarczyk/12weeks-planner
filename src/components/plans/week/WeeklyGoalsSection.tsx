/**
 * WeeklyGoalsSection Component
 * 
 * Displays all weekly goals for the current week with drag and drop support.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WeeklyGoalCard } from './WeeklyGoalCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { WeeklyGoalViewModel, TaskViewModel, SimpleGoal, SimpleMilestone } from '@/types';
import { CreateWeeklyGoalDialog } from './CreateWeeklyGoalDialog';

interface WeeklyGoalsSectionProps {
  goals: WeeklyGoalViewModel[];
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  onUpdateGoal: (id: string, updates: Partial<WeeklyGoalViewModel>) => void;
  onDeleteGoal: (id: string) => void;
  onAddGoal: (title: string, longTermGoalId?: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskViewModel>) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignDay: (taskId: string, day: number | null) => void;
  onLinkMilestone: (taskId: string, milestoneId: string | null) => void;
  onLinkGoal: (goalId: string, longTermGoalId: string | null) => void;
}

export function WeeklyGoalsSection({
  goals,
  availableLongTermGoals,
  availableMilestones,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoal,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onLinkMilestone,
  onLinkGoal,
}: WeeklyGoalsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateGoal = (title: string, longTermGoalId?: string) => {
    onAddGoal(title, longTermGoalId);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Weekly Goals</h2>
          <p className="text-sm text-muted-foreground">
            Plan your goals for this week
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Weekly Goal
        </Button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No weekly goals yet. Create your first goal to get started.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Weekly Goal
          </Button>
        </div>
      ) : (
        <SortableContext items={goals.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {goals.map((goal) => (
              <WeeklyGoalCard
                key={goal.id}
                goal={goal}
                availableLongTermGoals={availableLongTermGoals}
                availableMilestones={availableMilestones}
                onUpdate={onUpdateGoal}
                onDelete={onDeleteGoal}
                onAddTask={onAddTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAssignDay={onAssignDay}
                onLinkMilestone={onLinkMilestone}
                onLinkGoal={onLinkGoal}
              />
            ))}
          </div>
        </SortableContext>
      )}

      {/* Create Goal Dialog */}
      <CreateWeeklyGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateGoal}
        availableLongTermGoals={availableLongTermGoals}
      />
    </div>
  );
}

