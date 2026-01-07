/**
 * TaskItem Component
 * 
 * Displays a single task with status control, title, priority badge, category, goal and milestone info, and day assignment.
 * Supports inline editing, drag-and-drop reordering, and context menu for actions.
 */

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { TaskStatusControl } from './TaskStatusControl';
import { DragHandle } from './DragHandle';
import type { TaskViewModel, TaskPriority, TaskStatus, SimpleMilestone, WeeklyGoalViewModel, SimpleGoal } from '@/types';
import { MoreVertical, Flag, Calendar, MoveRight, MoveLeft, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalMilestonePicker } from './GoalMilestonePicker';

interface TaskItemProps {
  task: TaskViewModel;
  isAdHoc?: boolean;
  availableMilestones: SimpleMilestone[];
  availableLongTermGoals: SimpleGoal[];
  availableWeeklyGoals?: WeeklyGoalViewModel[];
  onUpdate: (id: string, updates: Partial<TaskViewModel>) => void;
  onDelete: (id: string) => void;
  onAssignDay: (id: string, day: number | null) => void;
  onAssignToWeeklyGoal?: (taskId: string, goalId: string) => void;
  onUnassignFromWeeklyGoal?: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  A: 'bg-red-500 hover:bg-red-600',
  B: 'bg-yellow-500 hover:bg-yellow-600',
  C: 'bg-blue-500 hover:bg-blue-600',
};

const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-blue-500 text-white',
  finance: 'bg-green-500 text-white',
  hobby: 'bg-purple-500 text-white',
  relationships: 'bg-pink-500 text-white',
  health: 'bg-red-500 text-white',
  development: 'bg-orange-500 text-white',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TaskItem({
  task,
  isAdHoc = false,
  availableMilestones,
  availableLongTermGoals,
  availableWeeklyGoals = [],
  onUpdate,
  onDelete,
  onAssignDay,
  onAssignToWeeklyGoal,
  onUnassignFromWeeklyGoal,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sortable hook for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdate(task.id, { status: newStatus });
  };

  const handleTitleClick = () => {
    if (task.status !== 'completed') {
      setIsEditing(true);
    }
  };

  const handleTitleSave = () => {
    if (editValue.trim() && editValue !== task.title) {
      onUpdate(task.id, { title: editValue.trim() });
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdate(task.id, { priority });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const getMilestoneTitle = (milestoneId: string | null) => {
    if (!milestoneId) return null;
    return availableMilestones.find(m => m.id === milestoneId)?.title;
  };

  const getLongTermGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find(g => g.id === goalId)?.title;
  };

  const getLongTermGoalCategory = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find(g => g.id === goalId)?.category;
  };

  const handleGoalMilestoneSelect = (goalId: string | null, milestoneId: string | null) => {
    onUpdate(task.id, {
      long_term_goal_id: goalId,
      milestone_id: milestoneId,
    });
    setIsPickerOpen(false);
  };

  // Check if task is linked to a weekly goal (task_type === 'weekly_sub')
  const isLinkedToWeeklyGoal = task.task_type === 'weekly_sub';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors',
        task.status === 'completed' && 'opacity-60',
        task.isSaving && 'opacity-50 pointer-events-none',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag Handle */}
      <DragHandle 
        listeners={listeners}
        attributes={attributes}
        setActivatorNodeRef={setActivatorNodeRef}
        disabled={task.isSaving}
        isDragging={isDragging}
      />

      {/* Task Status Control */}
      <TaskStatusControl
        status={task.status}
        onChange={handleStatusChange}
        disabled={task.isSaving}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="h-7 text-sm"
            disabled={task.isSaving}
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className={cn(
              'text-left text-sm w-full truncate hover:text-primary transition-colors',
              task.status === 'completed' && 'line-through'
            )}
            disabled={task.status === 'completed'}
          >
            {task.title}
          </button>
        )}
      </div>

      {/* Day Indicator */}
      {task.due_day && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="font-bold">{DAY_NAMES[task.due_day - 1]}</span>
        </div>
      )}
      
      {/* Category Badge - Only for ad-hoc tasks with assigned goal */}
      {isAdHoc && task.long_term_goal_id && getLongTermGoalCategory(task.long_term_goal_id) && (
        <Badge 
          className={cn(
            'text-xs uppercase font-semibold',
            CATEGORY_COLORS[getLongTermGoalCategory(task.long_term_goal_id)!] || 'bg-gray-500 text-white'
          )}
        >
          {getLongTermGoalCategory(task.long_term_goal_id)}
        </Badge>
      )}

      {/* Long-Term Goal Indicator */}
      {task.long_term_goal_id && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3" />
          <span className="truncate max-w-[200px]" title={getLongTermGoalTitle(task.long_term_goal_id) || undefined}>
            {getLongTermGoalTitle(task.long_term_goal_id)}
          </span>
        </div>
      )}

      {/* Milestone Indicator */}
      {task.milestone_id && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" />
          <span className="truncate max-w-[200px]" title={getMilestoneTitle(task.milestone_id) || undefined}>
            {getMilestoneTitle(task.milestone_id)}
          </span>
        </div>
      )}



      {/* Priority Badge */}
      <Badge
        className={cn('text-xs font-semibold text-white cursor-pointer', PRIORITY_COLORS[task.priority as TaskPriority])}
        onClick={() => {
          const priorities: TaskPriority[] = ['A', 'B', 'C'];
          const currentIndex = priorities.indexOf(task.priority as TaskPriority);
          const nextPriority = priorities[(currentIndex + 1) % priorities.length] as TaskPriority;
          handlePriorityChange(nextPriority);
        }}
      >
        {task.priority}
      </Badge>

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity"
            aria-label="Task options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Assign to Day */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Calendar className="mr-2 h-4 w-4" />
              Assign to Day
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {DAY_NAMES.map((day, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => onAssignDay(task.id, index + 1)}
                >
                  {day}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignDay(task.id, null)}>
                Clear Day
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Link Goal & Milestone - Only for ad-hoc tasks */}
          {!isLinkedToWeeklyGoal && (
            <DropdownMenuItem onClick={() => setIsPickerOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Goal & Milestone
            </DropdownMenuItem>
          )}

          {/* Priority */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handlePriorityChange('A')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.A)}>A</Badge>
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('B')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.B)}>B</Badge>
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('C')}>
                <Badge className={cn('mr-2', PRIORITY_COLORS.C)}>C</Badge>
                Low Priority
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Assign to Weekly Goal - Only for ad-hoc tasks */}
          {isAdHoc && onAssignToWeeklyGoal && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MoveRight className="mr-2 h-4 w-4" />
                Assign to Weekly Goal
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                {availableWeeklyGoals.length === 0 ? (
                  <DropdownMenuItem disabled>No weekly goals available</DropdownMenuItem>
                ) : (
                  availableWeeklyGoals.map((goal) => (
                    <DropdownMenuItem
                      key={goal.id}
                      onClick={() => onAssignToWeeklyGoal(task.id, goal.id)}
                    >
                      <span className="truncate">{goal.title}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Unassign from Weekly Goal - Only for weekly_sub tasks */}
          {!isAdHoc && task.task_type === 'weekly_sub' && onUnassignFromWeeklyGoal && (
            <DropdownMenuItem onClick={() => onUnassignFromWeeklyGoal(task.id)}>
              <MoveLeft className="mr-2 h-4 w-4" />
              Unassign from Weekly Goal
            </DropdownMenuItem>
          )}

          {(isAdHoc || task.task_type === 'weekly_sub') && <DropdownMenuSeparator />}

          {/* Delete */}
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Goal & Milestone Picker Dialog */}
      <GoalMilestonePicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        availableGoals={availableLongTermGoals}
        availableMilestones={availableMilestones}
        currentGoalId={task.long_term_goal_id}
        currentMilestoneId={task.milestone_id}
        onSelect={handleGoalMilestoneSelect}
        title="Link Task to Goal & Milestone"
        description="Link this task to a long-term goal and optionally a milestone."
      />
    </div>
  );
}

