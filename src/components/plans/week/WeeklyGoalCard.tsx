/**
 * WeeklyGoalCard Component
 * 
 * Card representing a single weekly goal with its associated tasks.
 * Displays goal title, link to long-term goal, progress, and task list.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { TaskItem } from './TaskItem';
import { InlineAddTask } from './InlineAddTask';
import type { WeeklyGoalViewModel, TaskViewModel, SimpleGoal, SimpleMilestone } from '@/types';
import { Link2, MoreVertical, Trash2, Plus } from 'lucide-react';
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
  onLinkMilestone: (taskId: string, milestoneId: string | null) => void;
  onLinkGoal: (goalId: string, longTermGoalId: string | null) => void;
}

const MAX_TASKS_PER_GOAL = 10;

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
  onLinkMilestone,
  onLinkGoal,
}: WeeklyGoalCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState(goal.title);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const completedTasks = goal.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = goal.tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isAtTaskLimit = totalTasks >= MAX_TASKS_PER_GOAL;

  const getLongTermGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find(g => g.id === goalId)?.title;
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

            {/* Long-term Goal Link */}
            {goal.long_term_goal_id && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                <span className="truncate">
                  {getLongTermGoalTitle(goal.long_term_goal_id)}
                </span>
              </div>
            )}
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
              {/* Link to Long-term Goal */}
              <DropdownMenuItem
                onClick={() => {
                  // This will be handled by a dialog in the future
                  // For now, just show available goals
                  const goalId = prompt(
                    `Available goals:\n${availableLongTermGoals.map(g => `${g.title} (${g.id})`).join('\n')}\n\nEnter goal ID or leave empty to unlink:`
                  );
                  onLinkGoal(goal.id, goalId || null);
                }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Link to Long-term Goal
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
        <div className="space-y-2">
          {goal.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              availableMilestones={availableMilestones}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onAssignDay={onAssignDay}
              onLinkMilestone={onLinkMilestone}
            />
          ))}

          {/* Empty State */}
          {goal.tasks.length === 0 && !isAddingTask && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No tasks yet. Add your first task below.
            </div>
          )}

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
      </CardContent>
    </Card>
  );
}

