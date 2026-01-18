/**
 * WeeklyGoalCard Component
 * 
 * Card representing a single weekly goal with its associated tasks.
 * Displays goal title, link to long-term goal, progress, and task list.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { TaskItem } from './TaskItem';
import { InlineAddTask } from './InlineAddTask';
import { GoalMilestonePicker } from './GoalMilestonePicker';
import type { WeeklyGoalViewModel, TaskViewModel, SimpleGoal, SimpleMilestone } from '@/types';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import { Target, MoreVertical, Trash2, Plus, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyGoalCardProps {
  goal: WeeklyGoalViewModel;
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  onUpdate: (id: string, updates: Partial<WeeklyGoalViewModel>) => void;
  onDelete: (id: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskViewModel>) => void;
  onDeleteTask: (taskId: string) => void;
  onAssignDay: (taskId: string, day: number | null) => void;
  onLinkGoal: (goalId: string, longTermGoalId: string | null, milestoneId: string | null) => void;
  onUnassignFromWeeklyGoal: (taskId: string) => void;
}

const MAX_TASKS_PER_GOAL = 15;

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find(cat => cat.value === category);
  return categoryItem?.label || category;
};

export function WeeklyGoalCard({
  goal,
  availableLongTermGoals,
  availableMilestones,
  onUpdate,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignDay,
  onLinkGoal,
  onUnassignFromWeeklyGoal,
}: WeeklyGoalCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState(goal.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const completedTasks = goal.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = goal.tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAtTaskLimit = totalTasks >= MAX_TASKS_PER_GOAL;

  const getLongTermGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find(g => g.id === goalId)?.title;
  };

  const getLongTermGoalCategory = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find(g => g.id === goalId)?.category;
  };

  const getMilestoneTitle = (milestoneId: string | null) => {
    if (!milestoneId) return null;
    return availableMilestones.find(m => m.id === milestoneId)?.title;
  };

  const handleGoalMilestoneSelect = (goalId: string | null, milestoneId: string | null) => {
    onLinkGoal(goal.id, goalId, milestoneId);
    setIsPickerOpen(false);
  };

  const handleTitleSave = () => {
    if (editValue.trim() && editValue !== goal.title) {
      onUpdate(goal.id, { title: editValue.trim() });
    } else {
      setEditValue(goal.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditValue(goal.title);
      setIsEditingTitle(false);
    }
  };

  const handleDelete = () => {
    const taskCount = goal.tasks.length;
    const message = taskCount > 0
      ? `Are you sure you want to delete this weekly goal? This will also delete ${taskCount} task${taskCount > 1 ? 's' : ''}.`
      : 'Are you sure you want to delete this weekly goal?';

    if (confirm(message)) {
      onDelete(goal.id);
    }
  };

  const handleAddTask = (title: string) => {
    onAddTask(goal.id, title);
    setIsAddingTask(false);
  };

  return (
    <Card className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Goal Title */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="h-8 font-semibold"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-left font-semibold text-base hover:text-primary transition-colors w-full"
              >
                {goal.title}
              </button>
            )}

            {/* Category, Long-term Goal & Milestone Links */}
            <div className="flex flex-wrap gap-2 mt-2">
              {goal.long_term_goal_id && getLongTermGoalCategory(goal.long_term_goal_id) && (
                <Badge
                  className={GOAL_CATEGORY_COLORS[getLongTermGoalCategory(goal.long_term_goal_id)!] || 'bg-gray-500 text-white'}
                >
                  {getCategoryLabel(getLongTermGoalCategory(goal.long_term_goal_id)!)}
                </Badge>
              )}
              {goal.long_term_goal_id && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Target className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">
                    {getLongTermGoalTitle(goal.long_term_goal_id)}
                  </span>
                </Badge>
              )}
              {goal.milestone_id && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Flag className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">
                    {getMilestoneTitle(goal.milestone_id)}
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Link to Goal & Milestone */}
              <DropdownMenuItem onClick={() => setIsPickerOpen(true)}>
                <Target className="mr-2 h-4 w-4" />
                Link Goal & Milestone
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedTasks} / {totalTasks} tasks</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  progressPercentage === 100 ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Task List */}
        <SortableContext items={goal.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {goal.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isAdHoc={false}
                availableMilestones={availableMilestones}
                availableLongTermGoals={availableLongTermGoals}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                onAssignDay={onAssignDay}
                onUnassignFromWeeklyGoal={onUnassignFromWeeklyGoal}
              />
            ))}

          {/* Add Task */}
          {isAddingTask ? (
            <InlineAddTask
              onAdd={handleAddTask}
              onCancel={() => setIsAddingTask(false)}
              placeholder="Enter task title..."
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingTask(true)}
              disabled={isAtTaskLimit}
              className="w-full mt-2"
              title={isAtTaskLimit ? `Maximum ${MAX_TASKS_PER_GOAL} tasks per goal reached` : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task {isAtTaskLimit && `(${totalTasks}/${MAX_TASKS_PER_GOAL})`}
            </Button>
          )}

          {/* Task Limit Warning */}
          {isAtTaskLimit && (
            <p className="text-xs text-amber-600 mt-2">
              Maximum task limit reached ({MAX_TASKS_PER_GOAL} tasks per goal)
            </p>
          )}
          </div>
        </SortableContext>
      </CardContent>

      {/* Goal & Milestone Picker Dialog */}
      <GoalMilestonePicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        availableGoals={availableLongTermGoals}
        availableMilestones={availableMilestones}
        currentGoalId={goal.long_term_goal_id}
        currentMilestoneId={goal.milestone_id}
        onSelect={handleGoalMilestoneSelect}
        title="Link Weekly Goal"
        description="Link this weekly goal to a long-term goal and optionally a milestone."
      />
    </Card>
  );
}

