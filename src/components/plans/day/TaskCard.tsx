/**
 * TaskCard Component (Day View Variant)
 *
 * Specialized task card for day view with:
 * - Badge hierarchy: category > goal > milestone > weekly goal
 * - Hidden day badge (already in day view context)
 * - Copy/Move actions in context menu
 * - Weekly goal assignment options
 */

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskStatusControl } from "../week/TaskStatusControl";
import { DragHandle } from "../week/DragHandle";
import { GoalMilestonePicker } from "../week/GoalMilestonePicker";
import type { DayTaskViewModel, TaskPriority, TaskStatus, SimpleGoal, SimpleMilestone, PlanStatus } from "@/types";
import { GOAL_CATEGORIES, GOAL_CATEGORY_COLORS, PRIORITY_COLORS, DAY_NAMES } from "@/types";
import {
  MoreVertical,
  Flag,
  Target,
  Copy,
  MoveRight,
  MoveLeft,
  ArrowRight,
  Trash2,
  Calendar,
  Clock,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDisabledTooltip } from "@/lib/utils";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

interface TaskCardProps {
  task: DayTaskViewModel;
  variant?: "day" | "week";
  availableLongTermGoals: SimpleGoal[];
  availableMilestones: SimpleMilestone[];
  availableWeeklyGoals: {
    id: string;
    title: string;
    long_term_goal_id: string | null;
    milestone_id: string | null;
  }[];
  weekNumber: number;
  dayNumber: number;
  planStatus: PlanStatus;
  isReadOnly: boolean;
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

/**
 * Get the display label for a goal category
 */
const getCategoryLabel = (category: string): string => {
  const categoryItem = GOAL_CATEGORIES.find((cat) => cat.value === category);
  return categoryItem?.label || category;
};

export function TaskCard({
  task,
  variant = "day",
  availableLongTermGoals,
  availableMilestones,
  availableWeeklyGoals,
  weekNumber,
  dayNumber,
  planStatus,
  isReadOnly,
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for optimistic priority display (for debounced updates)
  const [displayedPriority, setDisplayedPriority] = useState(task.priority);

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

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange(task.id, newStatus);
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

  const handlePriorityClick = () => {
    if (isReadOnly) return;

    const priorities: TaskPriority[] = ["A", "B", "C"];
    const currentIndex = priorities.indexOf(displayedPriority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    // Update local display immediately for instant feedback
    setDisplayedPriority(nextPriority);
    // Call parent handler (which is debounced)
    onPriorityChange(task.id, nextPriority);
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

  const handleGoalMilestoneSelect = (goalId: string | null, milestoneId: string | null) => {
    onLinkGoalMilestone(task.id, goalId, milestoneId);
    setIsPickerOpen(false);
  };

  // Helper functions
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

  const getWeeklyGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    return availableWeeklyGoals.find((g) => g.id === goalId)?.title;
  };

  const isLinkedToWeeklyGoal = task.task_type === "weekly_sub";
  const canCopyMove = task.status !== "completed" && task.status !== "cancelled";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border border-border bg-card p-2.5 hover:bg-accent/30 transition-colors shadow-sm",
        task.status === "completed" && "opacity-60",
        task.isSaving && "opacity-50 pointer-events-none",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
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

      {/* Badge Hierarchy for Day View: Category > Goal > Milestone > Weekly Goal */}
      {variant === "day" && (
        <div className="flex items-center gap-1.5">
          {/* Category Badge */}
          {task.long_term_goal_id && getLongTermGoalCategory(task.long_term_goal_id) && (
            <Badge
              className={cn(
                "text-xs uppercase font-semibold",
                GOAL_CATEGORY_COLORS[getLongTermGoalCategory(task.long_term_goal_id)!] ||
                  "bg-gray-500 text-white dark:bg-gray-600"
              )}
            >
              {getCategoryLabel(getLongTermGoalCategory(task.long_term_goal_id)!)}
            </Badge>
          )}

          {/* Long-Term Goal */}
          {task.long_term_goal_id && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline">
                <Target className="h-3 w-3" />
                <span
                  className="truncate max-w-[120px]"
                  title={getLongTermGoalTitle(task.long_term_goal_id) || undefined}
                >
                  {getLongTermGoalTitle(task.long_term_goal_id)}
                </span>
              </Badge>
            </div>
          )}

          {/* Milestone */}
          {task.milestone_id && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                <Flag className="h-3 w-3" />
                <span className="truncate max-w-[120px]" title={getMilestoneTitle(task.milestone_id) || undefined}>
                  {getMilestoneTitle(task.milestone_id)}
                </span>
              </Badge>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn("text-xs font-semibold text-white cursor-pointer", PRIORITY_COLORS[displayedPriority])}
            onClick={handlePriorityClick}
            title={isReadOnly ? undefined : "Click to change priority"}
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
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {/* Link Goal & Milestone */}
            {!isLinkedToWeeklyGoal && (
              <DropdownMenuItem onClick={() => setIsPickerOpen(true)}>
                <Target className="mr-2 h-4 w-4" />
                Link Goal & Milestone
              </DropdownMenuItem>
            )}

            {/* Assign/Unassign Weekly Goal */}
            {!isLinkedToWeeklyGoal && onAssignToWeeklyGoal && (
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

            {isLinkedToWeeklyGoal && onUnassignFromWeeklyGoal && (
              <DropdownMenuItem onClick={() => onUnassignFromWeeklyGoal(task.id)}>
                <MoveLeft className="mr-2 h-4 w-4" />
                Unassign from Weekly Goal
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Priority submenu with full status selection */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowUp className="mr-2 h-4 w-4" />
                Change Priority
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setDisplayedPriority("A");
                    onPriorityChange(task.id, "A");
                  }}
                >
                  <Badge className={cn("mr-2 text-white", PRIORITY_COLORS.A)}>A</Badge>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDisplayedPriority("B");
                    onPriorityChange(task.id, "B");
                  }}
                >
                  <Badge className={cn("mr-2 text-white", PRIORITY_COLORS.B)}>B</Badge>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDisplayedPriority("C");
                    onPriorityChange(task.id, "C");
                  }}
                >
                  <Badge className={cn("mr-2 text-white", PRIORITY_COLORS.C)}>C</Badge>
                  Low Priority
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Assign to Day (only show in week view or for changing day) */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Clock className="mr-2 h-4 w-4" />
                Assign to Day
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {DAY_NAMES.map((day, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => onAssignDay(task.id, index + 1)}
                    className={index + 1 === dayNumber ? "bg-accent" : ""}
                  >
                    {day} {index + 1 === dayNumber && "(current)"}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAssignDay(task.id, null)}>Clear Day</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Copy/Move Actions (Day View) */}
            {variant === "day" && onCopy && onMove && (
              <>
                {/* Move to Week/Day Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={!canCopyMove}>
                    <MoveRight className="mr-2 h-4 w-4" />
                    Move to Week/Day
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                    {/* Week selection */}
                    {(() => {
                      const currentWeek = weekNumber;
                      const weeks = Array.from({ length: 12 }, (_, i) => i + 1); // Show all 12 weeks

                      return weeks.map((weekNum) => (
                        <DropdownMenuSub key={weekNum}>
                          <DropdownMenuSubTrigger className={weekNum === currentWeek ? "bg-accent" : ""}>
                            {weekNum === currentWeek ? "Current" : `Week ${weekNum}`}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {/* Day selection */}
                            {DAY_NAMES.map((dayName, index) => {
                              const dayNum = index + 1;
                              return (
                                <DropdownMenuItem
                                  key={dayNum}
                                  onClick={() => onMove(task.id, weekNum, dayNum)}
                                  className={weekNum === currentWeek && dayNum === dayNumber ? "bg-accent" : ""}
                                >
                                  {dayName} {weekNum === currentWeek && dayNum === dayNumber && "(current)"}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ));
                    })()}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Copy to Week/Day Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={!canCopyMove}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Week/Day
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                    {/* Week selection */}
                    {(() => {
                      const currentWeek = weekNumber;
                      const weeks = Array.from({ length: 12 }, (_, i) => i + 1); // Show all 12 weeks

                      return weeks.map((weekNum) => (
                        <DropdownMenuSub key={weekNum}>
                          <DropdownMenuSubTrigger className={weekNum === currentWeek ? "bg-accent" : ""}>
                            {weekNum === currentWeek ? "Current" : `Week ${weekNum}`}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {/* Day selection */}
                            {DAY_NAMES.map((dayName, index) => {
                              const dayNum = index + 1;
                              return (
                                <DropdownMenuItem
                                  key={dayNum}
                                  onClick={() => onCopy(task.id, weekNum, dayNum)}
                                  className={weekNum === currentWeek && dayNum === dayNumber ? "bg-accent" : ""}
                                >
                                  {dayName} {weekNum === currentWeek && dayNum === dayNumber && "(current)"}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ));
                    })()}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {!canCopyMove && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Cannot copy/move completed or cancelled tasks
                  </div>
                )}
              </>
            )}

            <DropdownMenuSeparator />

            {/* Delete */}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription className="break-words">{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === "destructive" ? "destructive" : "default"}
              onClick={confirmDialog.onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
