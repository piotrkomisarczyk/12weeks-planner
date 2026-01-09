/**
 * DayPageContainer Component
 * 
 * Main container for the day planning view with drag and drop support.
 * Manages state, data fetching, and coordinates all child components.
 * Organizes tasks into three priority-based slots: Most Important, Secondary, Additional.
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { useDayPlan } from './hooks/useDayPlan';
import { DayHeader } from './DayHeader';
import { DailyTaskSlot } from './DailyTaskSlot';
import { ConfettiOverlay } from './ConfettiOverlay';
import type { DaySlot, DayTaskViewModel, TaskStatus, TaskPriority } from '@/types';

interface DayPageContainerProps {
  planId: string;
  planName: string;
  planStartDate: Date;
  weekNumber: number;
  dayNumber: number;
}

export function DayPageContainer({
  planId,
  planName,
  planStartDate,
  weekNumber,
  dayNumber,
}: DayPageContainerProps) {
  const {
    data,
    meta,
    status,
    error,
    isSaving,
    showConfetti,
    addTask,
    updateTask,
    deleteTask,
    reorderInSlot,
    changeTaskSlot,
    copyTask,
    moveTask,
    refetch,
  } = useDayPlan(planId, planStartDate, weekNumber, dayNumber);

  // Debounce ref for priority changes
  const priorityChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (priorityChangeTimeoutRef.current) {
        clearTimeout(priorityChangeTimeoutRef.current);
      }
    };
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((newDayNumber: number) => {
    // Validate day number range
    if (newDayNumber < 1 || newDayNumber > 7) return;
    window.location.href = `/plans/${planId}/week/${weekNumber}/day/${newDayNumber}`;
  }, [planId, weekNumber]);

  // Task handlers
  const handleAddTask = useCallback(async (slot: DaySlot, title: string) => {
    try {
      await addTask(slot, title);
      toast.success('Task created');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      toast.error(errorMessage);
      console.error(err);
    }
  }, [addTask]);

  const handleUpdateTask = useCallback(async (
    id: string, 
    updates: Partial<DayTaskViewModel>
  ) => {
    try {
      await updateTask(id, updates);
    } catch (err) {
      toast.error('Failed to update task');
      console.error(err);
    }
  }, [updateTask]);

  const handleDeleteTask = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
      console.error(err);
    }
  }, [deleteTask]);

  const handleStatusChange = useCallback(async (id: string, newStatus: TaskStatus) => {
    try {
      await updateTask(id, { status: newStatus });
    } catch (err) {
      toast.error('Failed to update task status');
      console.error(err);
    }
  }, [updateTask]);

  const handlePriorityChange = useCallback((id: string, newPriority: TaskPriority) => {
    // Clear any existing debounce timeout
    if (priorityChangeTimeoutRef.current) {
      clearTimeout(priorityChangeTimeoutRef.current);
    }

    // Debounce the entire priority change operation (1000ms)
    priorityChangeTimeoutRef.current = setTimeout(async () => {
      try {
        // Find the task to determine new slot
        let task: DayTaskViewModel | null = null;
        let currentSlot: DaySlot | null = null;
        
        if (data.slots.mostImportant?.id === id) {
          task = data.slots.mostImportant;
          currentSlot = 'most_important';
        } else if (data.slots.secondary.find(t => t.id === id)) {
          task = data.slots.secondary.find(t => t.id === id)!;
          currentSlot = 'secondary';
        } else if (data.slots.additional.find(t => t.id === id)) {
          task = data.slots.additional.find(t => t.id === id)!;
          currentSlot = 'additional';
        }

        if (!task || !currentSlot) return;

        // Determine target slot based on new priority
        let targetSlot: DaySlot;
        if (newPriority === 'A') {
          // Try most_important first, then secondary
          if (!data.slots.mostImportant && currentSlot !== 'most_important') {
            targetSlot = 'most_important';
          } else if (data.slots.secondary.length < 2 || currentSlot === 'secondary') {
            targetSlot = 'secondary';
          } else {
            targetSlot = 'additional';
          }
        } else if (newPriority === 'B') {
          // Try secondary first
          if (data.slots.secondary.length < 2 || currentSlot === 'secondary') {
            targetSlot = 'secondary';
          } else {
            targetSlot = 'additional';
          }
        } else {
          targetSlot = 'additional';
        }

        // Update priority and move to new slot if needed
        if (targetSlot !== currentSlot) {
          // Slot change required - use changeTaskSlot which updates priority and moves
          await changeTaskSlot(id, targetSlot);
        } else {
          // Just update priority, no slot change
          await updateTask(id, { priority: newPriority });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to change priority';
        toast.error(errorMessage);
        console.error(err);
      }
    }, 1000);
  }, [data, updateTask, changeTaskSlot]);

  const handleAssignDay = useCallback(async (id: string, day: number | null) => {
    try {
      if (day === null) {
        // Clear day assignment
        await updateTask(id, { due_day: null });
        toast.success('Day assignment cleared');
      } else {
        // Move to specific day
        await moveTask(id, weekNumber, day);
        toast.success(`Task moved to day ${day}`);
      }
    } catch (err) {
      toast.error('Failed to assign day');
      console.error(err);
    }
  }, [updateTask, moveTask, weekNumber]);

  const handleCopyTask = useCallback(async (
    id: string, 
    targetWeek?: number, 
    targetDay?: number
  ) => {
    // Don't allow copying completed/cancelled tasks
    const task = [
      data.slots.mostImportant,
      ...data.slots.secondary,
      ...data.slots.additional,
    ].find(t => t?.id === id);
    
    if (task && (task.status === 'completed' || task.status === 'cancelled')) {
      toast.error('Cannot copy completed or cancelled tasks');
      return;
    }

    try {
      await copyTask(id, targetWeek, targetDay);
      toast.success('Task copied');
    } catch (err) {
      toast.error('Failed to copy task');
      console.error(err);
    }
  }, [data, copyTask]);

  const handleMoveTask = useCallback(async (
    id: string, 
    targetWeek?: number, 
    targetDay?: number
  ) => {
    // Don't allow moving completed/cancelled tasks between days
    const task = [
      data.slots.mostImportant,
      ...data.slots.secondary,
      ...data.slots.additional,
    ].find(t => t?.id === id);
    
    if (task && (task.status === 'completed' || task.status === 'cancelled')) {
      if (targetWeek !== weekNumber || targetDay !== dayNumber) {
        toast.error('Cannot move completed or cancelled tasks to different days');
        return;
      }
    }

    try {
      await moveTask(id, targetWeek, targetDay);
      if (targetWeek !== weekNumber || targetDay !== dayNumber) {
        toast.success('Task moved');
      }
    } catch (err) {
      toast.error('Failed to move task');
      console.error(err);
    }
  }, [data, moveTask, weekNumber, dayNumber]);

  const handleLinkGoalMilestone = useCallback(async (
    taskId: string,
    longTermGoalId: string | null,
    milestoneId: string | null
  ) => {
    try {
      await updateTask(taskId, {
        long_term_goal_id: longTermGoalId,
        milestone_id: milestoneId,
      });
      toast.success('Goal & milestone linked');
    } catch (err) {
      toast.error('Failed to link goal & milestone');
      console.error(err);
    }
  }, [updateTask]);

  const handleAssignToWeeklyGoal = useCallback(async (
    taskId: string,
    weeklyGoalId: string
  ) => {
    try {
      // Check if weekly goal already has 10 tasks
      const weeklyGoal = meta.weeklyGoals.find(wg => wg.id === weeklyGoalId);
      if (!weeklyGoal) {
        toast.error('Weekly goal not found');
        return;
      }

      // Note: We should fetch the task count for the weekly goal from API
      // For now, we'll attempt the update and handle server-side validation
      await updateTask(taskId, {
        weekly_goal_id: weeklyGoalId,
        task_type: 'weekly_sub',
        long_term_goal_id: weeklyGoal.long_term_goal_id,
        milestone_id: weeklyGoal.milestone_id,
      });
      toast.success('Assigned to weekly goal');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign to weekly goal';
      toast.error(errorMessage);
      console.error(err);
    }
  }, [updateTask, meta.weeklyGoals]);

  const handleUnassignFromWeeklyGoal = useCallback(async (taskId: string) => {
    try {
      await updateTask(taskId, {
        weekly_goal_id: null,
        task_type: 'ad_hoc',
      });
      toast.success('Unassigned from weekly goal');
    } catch (err) {
      toast.error('Failed to unassign from weekly goal');
      console.error(err);
    }
  }, [updateTask]);

  // Drag and drop handler (only within same slot)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find which slot the dragged task belongs to
    let sourceSlot: DaySlot | null = null;
    let tasks: DayTaskViewModel[] = [];

    if (data.slots.mostImportant?.id === active.id) {
      sourceSlot = 'most_important';
      tasks = [data.slots.mostImportant];
    } else if (data.slots.secondary.find(t => t.id === active.id)) {
      sourceSlot = 'secondary';
      tasks = [...data.slots.secondary];
    } else if (data.slots.additional.find(t => t.id === active.id)) {
      sourceSlot = 'additional';
      tasks = [...data.slots.additional];
    }

    if (!sourceSlot) return;

    // Reorder within the same slot
    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order
    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Update backend
    reorderInSlot(sourceSlot, reorderedTasks).catch(err => {
      toast.error('Failed to reorder tasks');
      console.error(err);
    });
  }, [data, reorderInSlot]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading day plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800 font-medium mb-4">Error loading day plan</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl p-6">
          {/* Constrained width container for aligned header and slots */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <DayHeader
              planName={planName}
              dayNumber={dayNumber}
              weekNumber={weekNumber}
              computedDate={data.date}
              planStartDate={planStartDate}
              onNavigate={handleNavigate}
            />

            {/* Priority Slots - Vertical Layout */}
            <div className="space-y-6">
            {/* Most Important */}
            <DailyTaskSlot
              slot="most_important"
              title="Most Important"
              limit={1}
              tasks={data.slots.mostImportant ? [data.slots.mostImportant] : []}
              availableLongTermGoals={meta.longTermGoals}
              availableMilestones={meta.milestones}
              availableWeeklyGoals={meta.weeklyGoals}
              onAddTask={(title) => handleAddTask('most_important', title)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssignDay={handleAssignDay}
              onCopyTask={handleCopyTask}
              onMoveTask={handleMoveTask}
              onLinkGoalMilestone={handleLinkGoalMilestone}
              onAssignToWeeklyGoal={handleAssignToWeeklyGoal}
              onUnassignFromWeeklyGoal={handleUnassignFromWeeklyGoal}
              weekNumber={weekNumber}
              dayNumber={dayNumber}
            />

            {/* Secondary */}
            <DailyTaskSlot
              slot="secondary"
              title="Secondary"
              limit={2}
              tasks={data.slots.secondary}
              availableLongTermGoals={meta.longTermGoals}
              availableMilestones={meta.milestones}
              availableWeeklyGoals={meta.weeklyGoals}
              onAddTask={(title) => handleAddTask('secondary', title)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssignDay={handleAssignDay}
              onCopyTask={handleCopyTask}
              onMoveTask={handleMoveTask}
              onLinkGoalMilestone={handleLinkGoalMilestone}
              onAssignToWeeklyGoal={handleAssignToWeeklyGoal}
              onUnassignFromWeeklyGoal={handleUnassignFromWeeklyGoal}
              weekNumber={weekNumber}
              dayNumber={dayNumber}
            />

            {/* Additional */}
            <DailyTaskSlot
              slot="additional"
              title="Additional"
              limit={7}
              tasks={data.slots.additional}
              availableLongTermGoals={meta.longTermGoals}
              availableMilestones={meta.milestones}
              availableWeeklyGoals={meta.weeklyGoals}
              onAddTask={(title) => handleAddTask('additional', title)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssignDay={handleAssignDay}
              onCopyTask={handleCopyTask}
              onMoveTask={handleMoveTask}
              onLinkGoalMilestone={handleLinkGoalMilestone}
              onAssignToWeeklyGoal={handleAssignToWeeklyGoal}
              onUnassignFromWeeklyGoal={handleUnassignFromWeeklyGoal}
              weekNumber={weekNumber}
              dayNumber={dayNumber}
            />
            </div>
          </div>

          {/* Saving indicator */}
          {isSaving && (
            <div className="fixed bottom-4 left-4 bg-neutral-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}

          {/* Confetti overlay */}
          {showConfetti && <ConfettiOverlay />}
        </div>
      </div>
    </DndContext>
  );
}

