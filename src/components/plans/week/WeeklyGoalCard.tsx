/**
 * WeeklyGoalCard Component
 * 
 * Card representing a single weekly goal with its associated tasks.
 * Displays goal title, link to long-term goal, progress, and task list.
 */

import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskItem } from './TaskItem';
import { InlineAddTask } from './InlineAddTask';
import { GoalMilestonePicker } from './GoalMilestonePicker';
import type { WeeklyGoalViewModel, TaskViewModel, SimpleGoal, SimpleMilestone } from '@/types';
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '@/types';
import { Target, MoreVertical, Trash2, Plus, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

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
const MAX_TITLE_LENGTH = 120;

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find(cat => cat.value === category);
  return categoryItem?.label || category;
};

/**
 * Truncate title to max length and add ellipsis if needed
 */
const truncateTitle = (title: string, maxLength: number = MAX_TITLE_LENGTH): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
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
  const [expandedValue, setExpandedValue] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

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
    const description = taskCount > 0
      ? `Are you sure you want to delete "${goal.title}"? This will also delete ${taskCount} task${taskCount > 1 ? 's' : ''}. This action cannot be undone.`
      : `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Weekly Goal',
      description,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          onDelete(goal.id);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAddTask = (title: string) => {
    onAddTask(goal.id, title);
    setIsAddingTask(false);
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedValue}
      onValueChange={setExpandedValue}
      className="bg-card border rounded-lg"
    >
      <AccordionItem value={goal.id} className="border-none">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Left: Goal Info */}
            <div className="flex-1 min-w-0">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="text-left space-y-2 w-full">
                  {/* Title */}
                  {isEditingTitle ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="h-8 font-semibold"
                      maxLength={255}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 
                          className="font-semibold text-base"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditingTitle(true);
                          }}
                        >
                          {truncateTitle(goal.title)}
                        </h3>
                      </TooltipTrigger>
                      {goal.title.length > MAX_TITLE_LENGTH && (
                        <TooltipContent side="top" className="max-w-md">
                          <p>{goal.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}

                  {/* Category, Long-term Goal & Milestone Links - shown when collapsed */}
                  {expandedValue !== goal.id && (
                    <div className="flex flex-wrap gap-2">
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
                  )}
                </div>
              </AccordionTrigger>
            </div>

            {/* Actions Menu outside AccordionTrigger */}
            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Weekly goal actions"
                    onClick={(e) => e.stopPropagation()}
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
          </div>

          {/* Progress Bar (when collapsed) */}
          {expandedValue !== goal.id && totalTasks > 0 && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium">{completedTasks} / {totalTasks} tasks</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Expanded Content */}
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {/* Category, Long-term Goal & Milestone Links - shown when expanded */}
              <div className="flex flex-wrap gap-2">
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

              {/* Progress Bar (when expanded) */}
              {totalTasks > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{completedTasks} / {totalTasks} tasks</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t" />

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
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>

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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription className="break-words">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={confirmDialog.onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Accordion>
  );
}

