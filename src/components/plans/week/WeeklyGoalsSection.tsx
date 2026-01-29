/**
 * WeeklyGoalsSection Component
 * 
 * Displays all weekly goals for the current week with drag and drop support.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WeeklyGoalCard } from './WeeklyGoalCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WeeklyGoalViewModel, TaskViewModel, SimpleGoal, SimpleMilestone, PlanStatus } from '@/types';
import { CreateWeeklyGoalDialog } from './CreateWeeklyGoalDialog';
import { getDisabledTooltip } from '@/lib/utils';

interface WeeklyGoalsSectionProps {
  goals: WeeklyGoalViewModel[];
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  planId: string;
  weekNumber: number;
  planStatus: PlanStatus;
  isReadOnly: boolean;
  onUpdateGoal: (id: string, updates: Partial<WeeklyGoalViewModel>) => void;
  onDeleteGoal: (id: string) => void;
  onAddGoal: (title: string, longTermGoalId?: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskViewModel>) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignDay: (taskId: string, day: number | null) => void;
  onLinkGoal: (goalId: string, longTermGoalId: string | null, milestoneId: string | null) => void;
  onUnassignFromWeeklyGoal: (taskId: string) => void;
  onMoveGoalUp?: (id: string) => void;
  onMoveGoalDown?: (id: string) => void;
}

const MAX_WEEKLY_GOALS = 3;

export function WeeklyGoalsSection({
  goals,
  availableLongTermGoals,
  availableMilestones,
  planId,
  weekNumber,
  planStatus,
  isReadOnly,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoal,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onLinkGoal,
  onUnassignFromWeeklyGoal,
  onMoveGoalUp,
  onMoveGoalDown,
}: WeeklyGoalsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isAtGoalLimit = goals.length >= MAX_WEEKLY_GOALS;

  const handleCreateGoal = (title: string, longTermGoalId?: string) => {
    onAddGoal(title, longTermGoalId);
    setIsCreateDialogOpen(false);
  };

  const disabledTooltipText = `Maximum weekly goals reached. You can have up to ${MAX_WEEKLY_GOALS} weekly goals. Delete an existing goal to add a new one.`;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="rounded-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Weekly Goals</h2>
              <div className="text-sm text-muted-foreground mt-1">
                Plan your goals for this week {isAtGoalLimit && `(${goals.length}/${MAX_WEEKLY_GOALS})`}
              </div>
            </div>
            {(isAtGoalLimit || isReadOnly) ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      disabled
                      aria-disabled="true"
                      data-test-id="add-weekly-goal-button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Weekly Goal
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isReadOnly ? getDisabledTooltip(planStatus, 'general') : disabledTooltipText}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-test-id="add-weekly-goal-button">
                <Plus className="mr-2 h-4 w-4" />
                Add Weekly Goal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <SortableContext items={goals.map(g => g.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <WeeklyGoalCard
              key={goal.id}
              goal={goal}
              availableLongTermGoals={availableLongTermGoals}
              availableMilestones={availableMilestones}
              planId={planId}
              weekNumber={weekNumber}
              planStatus={planStatus}
              isReadOnly={isReadOnly}
              onUpdate={onUpdateGoal}
              onDelete={onDeleteGoal}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAssignDay={onAssignDay}
              onLinkGoal={onLinkGoal}
              onUnassignFromWeeklyGoal={onUnassignFromWeeklyGoal}
              onMoveUp={onMoveGoalUp}
              onMoveDown={onMoveGoalDown}
              isFirst={index === 0}
              isLast={index === goals.length - 1}
            />
          ))}
        </div>
      </SortableContext>

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
