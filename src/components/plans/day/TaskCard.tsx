/**
 * TaskCard Component (Day View Variant)
 * 
 * Specialized task card for day view with:
 * - Badge hierarchy: category > goal > milestone > weekly goal
 * - Hidden day badge (already in day view context)
 * - Copy/Move actions in context menu
 * - Weekly goal assignment options
 */

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { TaskStatusControl } from '../week/TaskStatusControl';
import { DragHandle } from '../week/DragHandle';
import { GoalMilestonePicker } from '../week/GoalMilestonePicker';
import type { 
  DayTaskViewModel, 
  TaskPriority, 
  TaskStatus, 
  SimpleGoal, 
  SimpleMilestone,
} from '@/types';
import { MoreVertical, Flag, Link2, Copy, MoveRight, MoveLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: DayTaskViewModel;
  variant?: 'day' | 'week';
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  availableWeeklyGoals: Array<{
    id: string;
    title: string;
    long_term_goal_id: string | null;
    milestone_id: string | null;
  }>;
  weekNumber: number;
  dayNumber: number;
  onUpdate: (id: string, updates: Partial<DayTaskViewModel>) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onAssignDay: (id: string, day: number | null) => void;
  onCopy?: (id: string, targetWeek?: number, targetDay?: number) => void;
  onMove?: (id: string, targetWeek?: number, targetDay?: number) => void;
  onLinkGoalMilestone: (taskId: string, goalId: string | null, milestoneId: string | null) => void;
  onAssignToWeeklyGoal?: (taskId: string, goalId: string) => void;
  onUnassignFromWeeklyGoal?: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  A: 'bg-red-500 hover:bg-red-600 dark:bg-red-800',
  B: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-700',
  C: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-blue-500 text-white dark:bg-blue-600',
  finance: 'bg-green-500 text-white dark:bg-green-600',
  hobby: 'bg-purple-500 text-white dark:bg-purple-600',
  relationships: 'bg-pink-500 text-white dark:bg-pink-600',
  health: 'bg-red-500 text-white dark:bg-red-600',
  development: 'bg-orange-500 text-white dark:bg-orange-600',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TaskCard({
  task,
  variant = 'day',
  availableLongTermGoals,
  availableMilestones,
  availableWeeklyGoals,
  weekNumber,
  dayNumber,
  onUpdate,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAssignDay,
  onCopy,
  onMove,
  onLinkGoalMilestone,
  onAssignToWeeklyGoal,
  onUnassignFromWeeklyGoal,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [copyMoveMenuOpen, setCopyMoveMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local state for optimistic priority display (for debounced updates)
  const [displayedPriority, setDisplayedPriority] = useState(task.priority);

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
  
  // Sync displayed priority with actual priority when it changes from outside
  useEffect(() => {
    setDisplayedPriority(task.priority);
  }, [task.priority]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange(task.id, newStatus);
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

  const handlePriorityClick = () => {
    const priorities: TaskPriority[] = ['A', 'B', 'C'];
    const currentIndex = priorities.indexOf(displayedPriority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    // Update local display immediately for instant feedback
    setDisplayedPriority(nextPriority);
    // Call parent handler (which is debounced)
    onPriorityChange(task.id, nextPriority);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleGoalMilestoneSelect = (goalId: string | null, milestoneId: string | null) => {
    onLinkGoalMilestone(task.id, goalId, milestoneId);
    setIsPickerOpen(false);
  };

  // Helper functions
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

  const getWeeklyGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableWeeklyGoals.find(g => g.id === goalId)?.title;
  };

  const isLinkedToWeeklyGoal = task.task_type === 'weekly_sub';
  const canCopyMove = task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-md border border-border bg-card p-2.5 hover:bg-accent/30 transition-colors shadow-sm',
        task.status === 'completed' && 'opacity-60',
        task.isSaving && 'opacity-50 pointer-events-none',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
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

      {/* Badge Hierarchy for Day View: Category > Goal > Milestone > Weekly Goal */}
      {variant === 'day' && (
        <div className="flex items-center gap-1.5">
          {/* Category Badge */}
          {task.long_term_goal_id && getLongTermGoalCategory(task.long_term_goal_id) && (
            <Badge 
              className={cn(
                'text-xs uppercase font-semibold',
                CATEGORY_COLORS[getLongTermGoalCategory(task.long_term_goal_id)!] || 'bg-gray-500 text-white dark:bg-gray-600'
              )}
            >
              {getLongTermGoalCategory(task.long_term_goal_id)}
            </Badge>
          )}

          {/* Long-Term Goal */}
          {task.long_term_goal_id && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span className="truncate max-w-[120px]" title={getLongTermGoalTitle(task.long_term_goal_id) || undefined}>
                {getLongTermGoalTitle(task.long_term_goal_id)}
              </span>
            </div>
          )}

          {/* Milestone */}
          {task.milestone_id && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flag className="h-3 w-3" />
              <span className="truncate max-w-[120px]" title={getMilestoneTitle(task.milestone_id) || undefined}>
                {getMilestoneTitle(task.milestone_id)}
              </span>
            </div>
          )}

          {/* Weekly Goal Badge */}
          {task.weekly_goal_id && (
            <Badge variant="outline" className="text-xs">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[100px]" title={getWeeklyGoalTitle(task.weekly_goal_id) || undefined}>
                {getWeeklyGoalTitle(task.weekly_goal_id)}
              </span>
            </Badge>
          )}
        </div>
      )}

      {/* Priority Badge */}
      <Badge
        className={cn('text-xs font-semibold text-white cursor-pointer', PRIORITY_COLORS[displayedPriority])}
        onClick={handlePriorityClick}
        title="Click to change priority"
      >
        {displayedPriority}
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
        <DropdownMenuContent align="end" className="w-56">
          {/* Priority submenu with full status selection */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change Priority</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => {
                setDisplayedPriority('A');
                onPriorityChange(task.id, 'A');
              }}>
                <Badge className={cn('mr-2 text-white', PRIORITY_COLORS.A)}>A</Badge>
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setDisplayedPriority('B');
                onPriorityChange(task.id, 'B');
              }}>
                <Badge className={cn('mr-2 text-white', PRIORITY_COLORS.B)}>B</Badge>
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setDisplayedPriority('C');
                onPriorityChange(task.id, 'C');
              }}>
                <Badge className={cn('mr-2 text-white', PRIORITY_COLORS.C)}>C</Badge>
                Low Priority
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Assign to Day (only show in week view or for changing day) */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Assign to Day</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {DAY_NAMES.map((day, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => onAssignDay(task.id, index + 1)}
                  className={index + 1 === dayNumber ? 'bg-accent' : ''}
                >
                  {day} {index + 1 === dayNumber && '(current)'}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignDay(task.id, null)}>
                Clear Day
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Copy/Move Actions (Day View) */}
          {variant === 'day' && onCopy && onMove && (
            <>
              <DropdownMenuItem 
                onClick={() => onCopy(task.id)}
                disabled={!canCopyMove}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy to Another Day
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  // Move within same week to different day - show simple prompt
                  const day = prompt(`Move to which day? (1-7, current: ${dayNumber})`);
                  if (day) {
                    const dayNum = parseInt(day, 10);
                    if (dayNum >= 1 && dayNum <= 7) {
                      onMove(task.id, weekNumber, dayNum);
                    }
                  }
                }}
                disabled={!canCopyMove}
              >
                <MoveRight className="mr-2 h-4 w-4" />
                Move to Another Day
              </DropdownMenuItem>

              {!canCopyMove && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Cannot copy/move completed or cancelled tasks
                </div>
              )}

              <DropdownMenuSeparator />
            </>
          )}

          {/* Link Goal & Milestone */}
          {!isLinkedToWeeklyGoal && (
            <DropdownMenuItem onClick={() => setIsPickerOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Goal & Milestone
            </DropdownMenuItem>
          )}

          {/* Assign/Unassign Weekly Goal */}
          {!isLinkedToWeeklyGoal && onAssignToWeeklyGoal && (
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

          {isLinkedToWeeklyGoal && onUnassignFromWeeklyGoal && (
            <DropdownMenuItem onClick={() => onUnassignFromWeeklyGoal(task.id)}>
              <MoveLeft className="mr-2 h-4 w-4" />
              Unassign from Weekly Goal
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

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

