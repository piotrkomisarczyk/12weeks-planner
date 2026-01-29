/**
 * TaskItem Component
 *
 * Displays a single task with status control, title, priority badge, category, goal and milestone info, and day assignment.
 * Supports inline editing, drag-and-drop reordering, and context menu for actions.
 */

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskStatusControl } from "./TaskStatusControl";
import { DragHandle } from "./DragHandle";
import type {
  TaskViewModel,
  TaskPriority,
  TaskStatus,
  SimpleMilestone,
  WeeklyGoalViewModel,
  SimpleGoal,
  PlanStatus,
} from "@/types";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS, PRIORITY_COLORS, DAY_NAMES } from "@/types";
import { getDisabledTooltip } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreVertical, Flag, Calendar, MoveLeft, Target, Trash2, Clock, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoalMilestonePicker } from "./GoalMilestonePicker";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

interface TaskItemProps {
  task: TaskViewModel;
  isAdHoc?: boolean;
  availableMilestones: SimpleMilestone[];
  availableLongTermGoals: SimpleGoal[];
  availableWeeklyGoals?: WeeklyGoalViewModel[];
  planId: string;
  weekNumber: number;
  planStatus: PlanStatus;
  isReadOnly: boolean;
  onUpdate: (id: string, updates: Partial<TaskViewModel>) => void;
  onDelete: (id: string) => void;
  onAssignDay: (id: string, day: number | null) => void;
  onAssignToWeeklyGoal?: (taskId: string, goalId: string) => void;
  onUnassignFromWeeklyGoal?: (taskId: string) => void;
}

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find((cat) => cat.value === category);
  return categoryItem?.label || category;
};

export function TaskItem({
  task,
  isAdHoc = false,
  availableMilestones,
  availableLongTermGoals,
  availableWeeklyGoals = [],
  planId,
  weekNumber,
  planStatus,
  isReadOnly,
  onUpdate,
  onDelete,
  onAssignDay,
  onAssignToWeeklyGoal,
  onUnassignFromWeeklyGoal,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDayBadgeHovered, setIsDayBadgeHovered] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {
      // Placeholder function, will be replaced when dialog is opened
    },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for optimistic priority display (for debounced updates)
  const [displayedPriority, setDisplayedPriority] = useState(task.priority);

  // Debounce ref for priority changes
  const priorityChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sortable hook for drag and drop
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

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

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (priorityChangeTimeoutRef.current) {
        clearTimeout(priorityChangeTimeoutRef.current);
      }
    };
  }, []);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdate(task.id, { status: newStatus });
  };

  const handleTitleClick = () => {
    if (task.status !== "completed" && !isReadOnly) {
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
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    // Update local display immediately for instant feedback
    setDisplayedPriority(priority);

    // Clear any existing debounce timeout
    if (priorityChangeTimeoutRef.current) {
      clearTimeout(priorityChangeTimeoutRef.current);
    }

    // Debounce the API call (1000ms)
    priorityChangeTimeoutRef.current = setTimeout(() => {
      onUpdate(task.id, { priority });
    }, 1000);
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Task",
      description: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          onDelete(task.id);
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getMilestoneTitle = (milestoneId: string | null) => {
    if (!milestoneId) return null;
    return availableMilestones.find((m) => m.id === milestoneId)?.title;
  };

  const getLongTermGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find((g) => g.id === goalId)?.title;
  };

  const getLongTermGoalCategory = (goalId: string | null) => {
    if (!goalId) return null;
    return availableLongTermGoals.find((g) => g.id === goalId)?.category;
  };

  const handleGoalMilestoneSelect = (goalId: string | null, milestoneId: string | null) => {
    onUpdate(task.id, {
      long_term_goal_id: goalId,
      milestone_id: milestoneId,
    });
    setIsPickerOpen(false);
  };

  // Check if task is linked to a weekly goal (task_type === 'weekly_sub')
  const isLinkedToWeeklyGoal = task.task_type === "weekly_sub";

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-test-id={`task-item-${task.title}`}
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-accent/50 transition-colors",
        task.status === "completed" && "opacity-60",
        task.isSaving && "opacity-50 pointer-events-none",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DragHandle
              listeners={listeners}
              attributes={attributes}
              setActivatorNodeRef={setActivatorNodeRef}
              disabled={task.isSaving || isReadOnly}
              isDragging={isDragging}
            />
          </div>
        </TooltipTrigger>
        {isReadOnly && (
          <TooltipContent>
            <p>{getDisabledTooltip(planStatus, "general")}</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Task Status Control */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <TaskStatusControl
              status={task.status}
              onChange={handleStatusChange}
              disabled={task.isSaving || isReadOnly || planStatus === "ready"}
            />
          </div>
        </TooltipTrigger>
        {(isReadOnly || planStatus === "ready") && (
          <TooltipContent>
            <p>{getDisabledTooltip(planStatus, "task_status")}</p>
          </TooltipContent>
        )}
      </Tooltip>

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
            maxLength={255}
            disabled={task.isSaving}
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleTitleClick}
                className={cn("text-left text-sm w-full truncate hover:text-primary transition-colors")}
                disabled={task.status === "completed" || isReadOnly}
              >
                {task.title}
              </button>
            </TooltipTrigger>
            {isReadOnly && (
              <TooltipContent>
                <p>{getDisabledTooltip(planStatus, "general")}</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>

      {/* Day Indicator */}
      {task.due_day && (
        <button
          onClick={() => (window.location.href = `/plans/${planId}/week/${weekNumber}/day/${task.due_day}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title={`Go to day view for ${DAY_NAMES[task.due_day - 1]}`}
          onMouseEnter={() => setIsDayBadgeHovered(true)}
          onMouseLeave={() => setIsDayBadgeHovered(false)}
        >
          <Badge variant={isDayBadgeHovered ? "default" : "outline"}>
            <Calendar className="h-3 w-3" />
            <span className="font-bold">{DAY_NAMES[task.due_day - 1]}</span>
          </Badge>
        </button>
      )}

      {/* Category Badge - Only for ad-hoc tasks with assigned goal */}
      {isAdHoc && task.long_term_goal_id && getLongTermGoalCategory(task.long_term_goal_id) && (
        <Badge
          className={GOAL_CATEGORY_COLORS[getLongTermGoalCategory(task.long_term_goal_id)!] || "bg-gray-500 text-white"}
        >
          {getCategoryLabel(getLongTermGoalCategory(task.long_term_goal_id)!)}
        </Badge>
      )}

      {/* Long-Term Goal Indicator */}
      {task.long_term_goal_id && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Badge variant="outline">
            <Target className="h-3 w-3" />
            <span className="truncate max-w-[200px]" title={getLongTermGoalTitle(task.long_term_goal_id) || undefined}>
              {getLongTermGoalTitle(task.long_term_goal_id)}
            </span>
          </Badge>
        </div>
      )}

      {/* Milestone Indicator */}
      {task.milestone_id && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Badge variant="outline">
            <Flag className="h-3 w-3" />
            <span className="truncate max-w-[200px]" title={getMilestoneTitle(task.milestone_id) || undefined}>
              {getMilestoneTitle(task.milestone_id)}
            </span>
          </Badge>
        </div>
      )}

      {/* Priority Badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              "text-xs font-semibold text-white",
              isReadOnly ? "" : "cursor-pointer",
              PRIORITY_COLORS[displayedPriority as TaskPriority]
            )}
            onClick={() => {
              if (isReadOnly) return;
              const priorities: TaskPriority[] = ["A", "B", "C"];
              const currentIndex = priorities.indexOf(displayedPriority as TaskPriority);
              const nextPriority = priorities[(currentIndex + 1) % priorities.length] as TaskPriority;
              handlePriorityChange(nextPriority);
            }}
          >
            {displayedPriority}
          </Badge>
        </TooltipTrigger>
        {isReadOnly && (
          <TooltipContent>
            <p>{getDisabledTooltip(planStatus, "general")}</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Context Menu */}
      {!isReadOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity"
              aria-label="Task options"
              data-test-id={`task-menu-${task.title}`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Assign to Day */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Clock className="mr-2 h-4 w-4" />
                Assign to Day
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {DAY_NAMES.map((day, index) => (
                  <DropdownMenuItem key={index} onClick={() => onAssignDay(task.id, index + 1)}>
                    {day}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAssignDay(task.id, null)}>Clear Day</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Link Goal & Milestone - Only for ad-hoc tasks */}
            {!isLinkedToWeeklyGoal && (
              <DropdownMenuItem onClick={() => setIsPickerOpen(true)}>
                <Target className="mr-2 h-4 w-4" />
                Link Goal & Milestone
              </DropdownMenuItem>
            )}

            {/* Priority */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowUp className="mr-2 h-4 w-4" />
                Change Priority
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handlePriorityChange("A")}>
                  <Badge className={cn("mr-2", PRIORITY_COLORS.A)}>A</Badge>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange("B")}>
                  <Badge className={cn("mr-2", PRIORITY_COLORS.B)}>B</Badge>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange("C")}>
                  <Badge className={cn("mr-2", PRIORITY_COLORS.C)}>C</Badge>
                  Low Priority
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Assign to Weekly Goal - Only for ad-hoc tasks */}
            {isAdHoc && onAssignToWeeklyGoal && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  Assign to Weekly Goal
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                  {availableWeeklyGoals.length === 0 ? (
                    <DropdownMenuItem disabled>No weekly goals available</DropdownMenuItem>
                  ) : (
                    availableWeeklyGoals.map((goal) => (
                      <DropdownMenuItem key={goal.id} onClick={() => onAssignToWeeklyGoal(task.id, goal.id)}>
                        <span className="truncate">{goal.title}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            {/* Unassign from Weekly Goal - Only for weekly_sub tasks */}
            {!isAdHoc && task.task_type === "weekly_sub" && onUnassignFromWeeklyGoal && (
              <DropdownMenuItem onClick={() => onUnassignFromWeeklyGoal(task.id)}>
                <MoveLeft className="mr-2 h-4 w-4" />
                Unassign from Weekly Goal
              </DropdownMenuItem>
            )}

            {(isAdHoc || task.task_type === "weekly_sub") && <DropdownMenuSeparator />}

            {/* Delete */}
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
              data-test-id={`task-delete-menu-item-${task.title}`}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md" data-test-id={`task-delete-confirmation-dialog-${task.title}`}>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription className="break-words">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              data-test-id={`task-delete-cancel-button-${task.title}`}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === "destructive" ? "destructive" : "default"}
              onClick={confirmDialog.onConfirm}
              data-test-id={`task-delete-confirm-button-${task.title}`}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
