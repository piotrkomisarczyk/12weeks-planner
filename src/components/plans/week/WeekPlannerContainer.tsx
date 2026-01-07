/**
 * WeekPlannerContainer Component
 * 
 * Main container for the week planning view with drag and drop support.
 * Manages state, data fetching, and coordinates all child components.
 */

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { useWeekPlan } from './hooks/useWeekPlan';
import { WeekHeader } from './WeekHeader';
import { WeeklyGoalsSection } from './WeeklyGoalsSection';
import { AdHocSection } from './AdHocSection';
import type { WeeklyGoalViewModel, TaskViewModel } from '@/types';

interface WeekPlannerContainerProps {
  planId: string;
  weekNumber: number;
  planName: string;
  planStartDate: Date;
}

export function WeekPlannerContainer({
  planId,
  weekNumber,
  planName,
  planStartDate,
}: WeekPlannerContainerProps) {
  const {
    data,
    meta,
    status,
    error,
    addWeeklyGoal,
    updateWeeklyGoal,
    deleteWeeklyGoal,
    reorderWeeklyGoals,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch,
  } = useWeekPlan(planId, weekNumber);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Navigation handler
  const handleNavigate = useCallback((newWeekNumber: number) => {
    // In a real Astro app, we'd use window.location or Astro's navigate
    window.location.href = `/plans/${planId}/week/${newWeekNumber}`;
  }, [planId]);

  // Weekly Goal handlers
  const handleAddGoal = useCallback(async (title: string, longTermGoalId?: string) => {
    // Check weekly goal limit
    if (data.weeklyGoals.length >= 3) {
      toast.error('Maximum 3 weekly goals allowed per week');
      return;
    }

    try {
      await addWeeklyGoal(title, longTermGoalId);
      toast.success('Weekly goal created');
    } catch (err) {
      toast.error('Failed to create weekly goal');
      console.error(err);
    }
  }, [addWeeklyGoal, data.weeklyGoals.length]);

  const handleUpdateGoal = useCallback(async (id: string, updates: Partial<WeeklyGoalViewModel>) => {
    try {
      await updateWeeklyGoal(id, updates);
    } catch (err) {
      toast.error('Failed to update weekly goal');
      console.error(err);
    }
  }, [updateWeeklyGoal]);

  const handleDeleteGoal = useCallback(async (id: string) => {
    try {
      await deleteWeeklyGoal(id);
      toast.success('Weekly goal deleted');
    } catch (err) {
      toast.error('Failed to delete weekly goal');
      console.error(err);
    }
  }, [deleteWeeklyGoal]);

  const handleLinkGoal = useCallback(async (
    goalId: string, 
    longTermGoalId: string | null, 
    milestoneId: string | null
  ) => {
    try {
      // Update the weekly goal
      await updateWeeklyGoal(goalId, { 
        long_term_goal_id: longTermGoalId,
        milestone_id: milestoneId,
      });

      // Find all tasks belonging to this weekly goal
      const weeklyGoal = data.weeklyGoals.find(g => g.id === goalId);
      if (weeklyGoal && weeklyGoal.tasks.length > 0) {
        // Update all subtasks to inherit the new goal/milestone associations
        await Promise.all(
          weeklyGoal.tasks.map(task => 
            updateTask(task.id, {
              long_term_goal_id: longTermGoalId,
              milestone_id: milestoneId,
            })
          )
        );
      }

      // Refetch to update UI with new associations
      await refetch();
      toast.success('Goal & milestone linked, tasks updated');
    } catch (err) {
      toast.error('Failed to link goal & milestone');
      console.error(err);
    }
  }, [updateWeeklyGoal, updateTask, data.weeklyGoals, refetch]);

  // Task handlers
  const handleAddTask = useCallback(async (weeklyGoalId: string | null, title: string) => {
    try {
      await addTask(weeklyGoalId, title);
      toast.success('Task created');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      toast.error(errorMessage);
      console.error(err);
    }
  }, [addTask]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<TaskViewModel>) => {
    try {
      await updateTask(taskId, updates);
    } catch (err) {
      toast.error('Failed to update task');
      console.error(err);
    }
  }, [updateTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
      console.error(err);
    }
  }, [deleteTask]);

  const handleAssignDay = useCallback(async (taskId: string, day: number | null) => {
    try {
      await updateTask(taskId, { due_day: day });
      toast.success(day ? `Assigned to day ${day}` : 'Day cleared');
    } catch (err) {
      toast.error('Failed to assign day');
      console.error(err);
    }
  }, [updateTask]);


  const handleAssignToWeeklyGoal = useCallback(async (taskId: string, goalId: string) => {
    try {
      const targetGoal = data.weeklyGoals.find(g => g.id === goalId);
      if (!targetGoal) {
        toast.error('Weekly goal not found');
        return;
      }

      // Check if goal has reached task limit
      if (targetGoal.tasks.length >= 10) {
        toast.error('Weekly goal has reached maximum task limit (10)');
        return;
      }

      // Update task: set weekly_goal_id, change task_type, inherit goal/milestone associations
      await updateTask(taskId, {
        weekly_goal_id: goalId,
        task_type: 'weekly_sub',
        long_term_goal_id: targetGoal.long_term_goal_id,
        milestone_id: targetGoal.milestone_id,
      });
      
      // Refetch to move task from ad-hoc to weekly goal list
      await refetch();
      toast.success('Task assigned to weekly goal');
    } catch (err) {
      toast.error('Failed to assign task');
      console.error(err);
    }
  }, [data.weeklyGoals, updateTask, refetch]);

  const handleUnassignFromWeeklyGoal = useCallback(async (taskId: string) => {
    try {
      // Update task: clear weekly_goal_id, change to ad_hoc, keep goal/milestone associations
      await updateTask(taskId, {
        weekly_goal_id: null,
        task_type: 'ad_hoc',
        // Keep long_term_goal_id and milestone_id as per requirements
      });
      
      // Refetch to move task from weekly goal to ad-hoc list
      await refetch();
      toast.success('Task unassigned from weekly goal');
    } catch (err) {
      toast.error('Failed to unassign task');
      console.error(err);
    }
  }, [updateTask, refetch]);

  // Drag and Drop handlers
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Determine if we're dragging a goal or a task
    const isDraggingGoal = data.weeklyGoals.some(g => g.id === active.id);

    if (isDraggingGoal) {
      // Reordering weekly goals
      const oldIndex = data.weeklyGoals.findIndex(g => g.id === active.id);
      const newIndex = data.weeklyGoals.findIndex(g => g.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = [...data.weeklyGoals];
        const [removed] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, removed);

        try {
          await reorderWeeklyGoals(reordered);
        } catch (err) {
          toast.error('Failed to reorder goals');
          console.error(err);
        }
      }
    } else {
      // Reordering tasks - ONLY within the same container
      // Find source container
      let sourceContainerId: string | null = null;

      // Check if task is in a weekly goal
      for (const goal of data.weeklyGoals) {
        if (goal.tasks.some(t => t.id === active.id)) {
          sourceContainerId = goal.id;
          break;
        }
      }

      // Check if task is in ad-hoc
      if (!sourceContainerId && data.adHocTasks.some(t => t.id === active.id)) {
        sourceContainerId = null; // ad-hoc (represented as null)
      }

      // Determine destination container
      let destContainerId: string | null = null;

      if (typeof over.id === 'string') {
        // Check if dropping on a task - find which container it belongs to
        for (const goal of data.weeklyGoals) {
          if (goal.tasks.some(t => t.id === over.id)) {
            destContainerId = goal.id;
            break;
          }
        }
        
        if (!destContainerId && data.adHocTasks.some(t => t.id === over.id)) {
          destContainerId = null; // ad-hoc
        }
      }

      // BLOCK cross-container moves - only allow reordering within same container
      if (sourceContainerId !== destContainerId) {
        toast.error('Cannot move tasks between sections. Use context menu to assign/unassign.');
        return;
      }

      // Calculate new index within the same container
      let newIndex = 0;
      if (destContainerId) {
        // Moving within a weekly goal
        const destGoal = data.weeklyGoals.find(g => g.id === destContainerId);
        if (destGoal) {
          newIndex = destGoal.tasks.findIndex(t => t.id === over.id);
          if (newIndex === -1) newIndex = destGoal.tasks.length;
        }
      } else {
        // Moving within ad-hoc
        newIndex = data.adHocTasks.findIndex(t => t.id === over.id);
        if (newIndex === -1) newIndex = data.adHocTasks.length;
      }

      try {
        await moveTask(active.id as string, sourceContainerId, destContainerId, newIndex);
      } catch (err) {
        toast.error('Failed to reorder task');
        console.error(err);
      }
    }
  }, [data, reorderWeeklyGoals, moveTask]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <WeekHeader
          weekNumber={weekNumber}
          startDate={planStartDate}
          planName={planName}
          onNavigate={handleNavigate}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading week plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <WeekHeader
          weekNumber={weekNumber}
          startDate={planStartDate}
          planName={planName}
          onNavigate={handleNavigate}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || 'Failed to load week plan'}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-background">
      <WeekHeader
        weekNumber={weekNumber}
        startDate={planStartDate}
        planName={planName}
        onNavigate={handleNavigate}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Weekly Goals Section */}
          <WeeklyGoalsSection
            goals={data.weeklyGoals}
            availableLongTermGoals={meta.longTermGoals}
            availableMilestones={meta.milestones}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddGoal={handleAddGoal}
            onAddTask={(goalId, title) => handleAddTask(goalId, title)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAssignDay={handleAssignDay}
            onLinkGoal={handleLinkGoal}
            onUnassignFromWeeklyGoal={handleUnassignFromWeeklyGoal}
          />

          {/* Ad-hoc Tasks Section */}
          <AdHocSection
            tasks={data.adHocTasks}
            availableWeeklyGoals={data.weeklyGoals}
            availableMilestones={meta.milestones}
            availableLongTermGoals={meta.longTermGoals}
            onAddTask={(title) => handleAddTask(null, title)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAssignDay={handleAssignDay}
            onAssignToWeeklyGoal={handleAssignToWeeklyGoal}
          />
        </div>
      </DndContext>
    </div>
  );
}

