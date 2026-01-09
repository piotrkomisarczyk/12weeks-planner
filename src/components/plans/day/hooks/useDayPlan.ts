/**
 * useDayPlan Hook
 * 
 * Manages state and data fetching for the Day View.
 * Handles tasks organized by priority slots (most_important, secondary, additional),
 * and provides CRUD operations with optimistic updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  DayViewData,
  DayViewMeta,
  DayTaskViewModel,
  DaySlot,
  TaskPriority,
  CreateTaskCommand,
  UpdateTaskCommand,
  CopyTaskCommand,
} from '@/types';
import { 
  encodePosition, 
  getDayRank, 
  getWeekOrder,
  generateDayViewPositions,
} from '@/lib/position-utils';

type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseDayPlanReturn {
  data: DayViewData;
  meta: DayViewMeta;
  status: LoadingStatus;
  error: string | null;
  isSaving: boolean;
  showConfetti: boolean;
  
  // Task Actions
  addTask: (slot: DaySlot, title: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<UpdateTaskCommand>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderInSlot: (slot: DaySlot, newOrder: DayTaskViewModel[]) => Promise<void>;
  changeTaskSlot: (taskId: string, newSlot: DaySlot) => Promise<void>;
  copyTask: (taskId: string, targetWeek?: number, targetDay?: number) => Promise<void>;
  moveTask: (taskId: string, targetWeek?: number, targetDay?: number) => Promise<void>;
  
  // Utility
  refetch: () => Promise<void>;
}

// Slot limits
const SLOT_LIMITS = {
  most_important: 1,
  secondary: 2,
  additional: 7,
} as const;

/**
 * Helper: compute date from plan start date, week number, and day number
 */
function computeDate(planStartDate: Date, weekNumber: number, dayNumber: number): string {
  const date = new Date(planStartDate);
  const daysToAdd = (weekNumber - 1) * 7 + (dayNumber - 1);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Helper: map priority to default slot
 */
function priorityToSlot(priority: TaskPriority, currentSlotCounts: Record<DaySlot, number>): DaySlot {
  if (priority === 'A') {
    // Try most_important first, then secondary, then additional
    if (currentSlotCounts.most_important < SLOT_LIMITS.most_important) {
      return 'most_important';
    } else if (currentSlotCounts.secondary < SLOT_LIMITS.secondary) {
      return 'secondary';
    } else {
      return 'additional';
    }
  } else if (priority === 'B') {
    // Try secondary first, then additional
    if (currentSlotCounts.secondary < SLOT_LIMITS.secondary) {
      return 'secondary';
    } else {
      return 'additional';
    }
  } else {
    // Priority C always goes to additional
    return 'additional';
  }
}

/**
 * Helper: map slot to default priority
 */
function slotToPriority(slot: DaySlot): TaskPriority {
  if (slot === 'most_important') return 'A';
  if (slot === 'secondary') return 'B';
  return 'C';
}

/**
 * Custom hook for managing day planning data and operations
 * 
 * @param planId - UUID of the plan
 * @param planStartDate - Start date of the plan
 * @param weekNumber - Week number (1-12)
 * @param dayNumber - Day number (1-7, Monday=1)
 * @returns Hook interface with data, status, and action functions
 */
export function useDayPlan(
  planId: string,
  planStartDate: Date,
  weekNumber: number,
  dayNumber: number
): UseDayPlanReturn {
  const [data, setData] = useState<DayViewData>({
    weekNumber,
    dayNumber,
    date: computeDate(planStartDate, weekNumber, dayNumber),
    slots: {
      mostImportant: null,
      secondary: [],
      additional: [],
    },
  });
  
  const [meta, setMeta] = useState<DayViewMeta>({
    longTermGoals: [],
    milestones: [],
    weeklyGoals: [],
  });
  
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  /**
   * Check if all tasks are completed (for confetti effect)
   */
  const checkConfetti = useCallback((viewData: DayViewData) => {
    const allTasks = [
      viewData.slots.mostImportant,
      ...viewData.slots.secondary,
      ...viewData.slots.additional,
    ].filter(Boolean) as DayTaskViewModel[];
    
    if (allTasks.length === 0) {
      setShowConfetti(false);
      return;
    }
    
    const allCompleted = allTasks.every(task => task.status === 'completed');
    setShowConfetti(allCompleted);
  }, []);

  /**
   * Fetch all data for the day view
   */
  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // Fetch all data in parallel
      const [tasksRes, goalsRes, milestonesRes, weeklyGoalsRes] = await Promise.all([
        fetch(`/api/v1/tasks?plan_id=${planId}&week_number=${weekNumber}&due_day=${dayNumber}`),
        fetch(`/api/v1/plans/${planId}/goals`),
        fetch(`/api/v1/milestones`),
        fetch(`/api/v1/weekly-goals?plan_id=${planId}&week_number=${weekNumber}`),
      ]);

      // Check for errors
      if (!tasksRes.ok || !goalsRes.ok || !milestonesRes.ok || !weeklyGoalsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      // Parse responses
      const tasksData = await tasksRes.json();
      const goalsData = await goalsRes.json();
      const milestonesData = await milestonesRes.json();
      const weeklyGoalsData = await weeklyGoalsRes.json();

      // Extract arrays from responses
      const allTasks = tasksData.data || [];
      const longTermGoals = goalsData.data || [];
      const allMilestones = milestonesData.data || [];
      const weeklyGoals = weeklyGoalsData.data || [];
      
      // Filter milestones to only include those belonging to this plan's goals
      const goalIds = new Set(longTermGoals.map((g: any) => g.id));
      const milestones = allMilestones.filter((m: any) => goalIds.has(m.long_term_goal_id));

      // Map tasks to slots based on priority
      // Sort by priority (A > B > C) and position
      const sortedTasks = [...allTasks].sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority.localeCompare(b.priority);
        }
        return a.position - b.position;
      });

      const slotCounts: Record<DaySlot, number> = {
        most_important: 0,
        secondary: 0,
        additional: 0,
      };

      const tasksBySlot: Record<DaySlot, DayTaskViewModel[]> = {
        most_important: [],
        secondary: [],
        additional: [],
      };

      // Assign tasks to slots
      for (const task of sortedTasks) {
        const slot = priorityToSlot(task.priority, slotCounts);
        tasksBySlot[slot].push({ ...task, slot });
        slotCounts[slot]++;
      }

      // Set data
      const viewData: DayViewData = {
        weekNumber,
        dayNumber,
        date: computeDate(planStartDate, weekNumber, dayNumber),
        slots: {
          mostImportant: tasksBySlot.most_important[0] || null,
          secondary: tasksBySlot.secondary,
          additional: tasksBySlot.additional,
        },
      };

      setData(viewData);
      checkConfetti(viewData);

      // Set metadata
      setMeta({
        longTermGoals: longTermGoals.map((g: any) => ({
          id: g.id,
          title: g.title,
          category: g.category,
        })),
        milestones: milestones.map((m: any) => ({
          id: m.id,
          title: m.title,
          long_term_goal_id: m.long_term_goal_id,
          due_date: m.due_date,
        })),
        weeklyGoals: weeklyGoals.map((wg: any) => ({
          id: wg.id,
          title: wg.title,
          long_term_goal_id: wg.long_term_goal_id,
          milestone_id: wg.milestone_id,
        })),
      });

      setStatus('success');
    } catch (err) {
      console.error('Error fetching day plan data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  }, [planId, weekNumber, dayNumber, planStartDate, checkConfetti]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Add a new task to a specific slot
   */
  const addTask = useCallback(async (slot: DaySlot, title: string) => {
    // Check slot limit
    const currentCount = slot === 'most_important' 
      ? (data.slots.mostImportant ? 1 : 0)
      : data.slots[slot].length;
    
    if (currentCount >= SLOT_LIMITS[slot]) {
      throw new Error(`Cannot add task: ${slot} slot is full (max ${SLOT_LIMITS[slot]})`);
    }

    // Calculate next position using position encoding
    // Get weekOrder from existing tasks or default to 1
    const existingTasks = [
      data.slots.mostImportant,
      ...data.slots.secondary,
      ...data.slots.additional,
    ].filter(Boolean) as DayTaskViewModel[];
    
    const weekOrder = existingTasks.length > 0 
      ? getWeekOrder(existingTasks[0].position)
      : 1;
    
    const dayRank = currentCount + 1;
    const nextPosition = encodePosition(weekOrder, dayRank);
    const priority = slotToPriority(slot);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: DayTaskViewModel = {
      id: tempId,
      plan_id: planId,
      weekly_goal_id: null,
      long_term_goal_id: null,
      milestone_id: null,
      title,
      description: null,
      priority,
      status: 'todo',
      task_type: 'ad_hoc',
      week_number: weekNumber,
      due_day: dayNumber,
      position: nextPosition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slot,
    };

    const previousData = { ...data };
    
    if (slot === 'most_important') {
      setData(prev => ({
        ...prev,
        slots: { ...prev.slots, mostImportant: optimisticTask },
      }));
    } else {
      setData(prev => ({
        ...prev,
        slots: { ...prev.slots, [slot]: [...prev.slots[slot], optimisticTask] },
      }));
    }

    try {
      setIsSaving(true);
      
      const payload: CreateTaskCommand = {
        plan_id: planId,
        weekly_goal_id: null,
        long_term_goal_id: null,
        milestone_id: null,
        title,
        description: null,
        priority,
        status: 'todo',
        task_type: 'ad_hoc',
        week_number: weekNumber,
        due_day: dayNumber,
        position: nextPosition,
      };

      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json();
      const newTask = result.data;

      // Replace optimistic update with real data
      if (slot === 'most_important') {
        setData(prev => ({
          ...prev,
          slots: { ...prev.slots, mostImportant: { ...newTask, slot } },
        }));
      } else {
        setData(prev => ({
          ...prev,
          slots: {
            ...prev.slots,
            [slot]: prev.slots[slot].map(t => t.id === tempId ? { ...newTask, slot } : t),
          },
        }));
      }
    } catch (err) {
      console.error('Error creating task:', err);
      // Rollback optimistic update
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, planId, weekNumber, dayNumber]);

  /**
   * Update a task
   */
  const updateTask = useCallback(async (id: string, updates: Partial<UpdateTaskCommand>) => {
    const previousData = { ...data };

    // Apply optimistic update
    const updateInSlot = (task: DayTaskViewModel | null): DayTaskViewModel | null => 
      task?.id === id ? { ...task, ...updates } as DayTaskViewModel : task;
    
    const updateInArray = (tasks: DayTaskViewModel[]): DayTaskViewModel[] =>
      tasks.map(t => (t.id === id ? { ...t, ...updates } as DayTaskViewModel : t));

    setData(prev => ({
      ...prev,
      slots: {
        mostImportant: updateInSlot(prev.slots.mostImportant),
        secondary: updateInArray(prev.slots.secondary),
        additional: updateInArray(prev.slots.additional),
      },
    }));

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const result = await response.json();
      const updatedTask = result.data;

      // Update with real data
      setData(prev => {
        const newData = {
          ...prev,
          slots: {
            mostImportant: prev.slots.mostImportant?.id === id 
              ? { ...updatedTask, slot: prev.slots.mostImportant.slot } 
              : prev.slots.mostImportant,
            secondary: prev.slots.secondary.map(t => 
              t.id === id ? { ...updatedTask, slot: t.slot } : t
            ),
            additional: prev.slots.additional.map(t => 
              t.id === id ? { ...updatedTask, slot: t.slot } : t
            ),
          },
        };
        checkConfetti(newData);
        return newData;
      });
    } catch (err) {
      console.error('Error updating task:', err);
      // Rollback
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, checkConfetti]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string) => {
    const previousData = { ...data };

    // Optimistic update
    setData(prev => ({
      ...prev,
      slots: {
        mostImportant: prev.slots.mostImportant?.id === id ? null : prev.slots.mostImportant,
        secondary: prev.slots.secondary.filter(t => t.id !== id),
        additional: prev.slots.additional.filter(t => t.id !== id),
      },
    }));

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      // Rollback
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  /**
   * Reorder tasks within a slot
   * Uses position utilities to preserve week order while updating day rank
   */
  const reorderInSlot = useCallback(async (slot: DaySlot, newOrder: DayTaskViewModel[]) => {
    const previousData = { ...data };
    
    // Update positions using day view position logic
    // Preserves weekOrder, updates dayRank sequentially
    const tasksWithNewPositions = generateDayViewPositions(newOrder);

    if (slot === 'most_important') {
      setData(prev => ({
        ...prev,
        slots: { ...prev.slots, mostImportant: tasksWithNewPositions[0] || null },
      }));
    } else {
      setData(prev => ({
        ...prev,
        slots: { ...prev.slots, [slot]: tasksWithNewPositions },
      }));
    }

    try {
      setIsSaving(true);
      
      // Update each task's position
      await Promise.all(
        tasksWithNewPositions.map(task =>
          fetch(`/api/v1/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: task.position }),
          })
        )
      );
    } catch (err) {
      console.error('Error reordering tasks:', err);
      // Rollback
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  /**
   * Change task slot (by changing priority)
   */
  const changeTaskSlot = useCallback(async (taskId: string, newSlot: DaySlot) => {
    // Check if destination slot has space
    const destCount = newSlot === 'most_important'
      ? (data.slots.mostImportant ? 1 : 0)
      : data.slots[newSlot].length;
    
    if (destCount >= SLOT_LIMITS[newSlot]) {
      throw new Error(`Cannot move task: ${newSlot} slot is full (max ${SLOT_LIMITS[newSlot]})`);
    }

    // Find the task
    let task: DayTaskViewModel | null = null;
    let sourceSlot: DaySlot | null = null;
    
    if (data.slots.mostImportant?.id === taskId) {
      task = data.slots.mostImportant;
      sourceSlot = 'most_important';
    } else if (data.slots.secondary.find(t => t.id === taskId)) {
      task = data.slots.secondary.find(t => t.id === taskId)!;
      sourceSlot = 'secondary';
    } else if (data.slots.additional.find(t => t.id === taskId)) {
      task = data.slots.additional.find(t => t.id === taskId)!;
      sourceSlot = 'additional';
    }

    if (!task || !sourceSlot) return;

    const newPriority = slotToPriority(newSlot);
    const previousData = { ...data };

    // Optimistic update: remove from source, add to destination
    const updatedTask = { ...task, slot: newSlot, priority: newPriority };
    
    let newMostImportant = data.slots.mostImportant;
    let newSecondary = [...data.slots.secondary];
    let newAdditional = [...data.slots.additional];

    // Remove from source
    if (sourceSlot === 'most_important') {
      newMostImportant = null;
    } else if (sourceSlot === 'secondary') {
      newSecondary = newSecondary.filter(t => t.id !== taskId);
    } else {
      newAdditional = newAdditional.filter(t => t.id !== taskId);
    }

    // Add to destination
    if (newSlot === 'most_important') {
      newMostImportant = updatedTask;
    } else if (newSlot === 'secondary') {
      newSecondary.push(updatedTask);
    } else {
      newAdditional.push(updatedTask);
    }

    setData({
      ...data,
      slots: {
        mostImportant: newMostImportant,
        secondary: newSecondary,
        additional: newAdditional,
      },
    });

    try {
      setIsSaving(true);
      
      await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
    } catch (err) {
      console.error('Error changing task slot:', err);
      // Rollback
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  /**
   * Copy task to another day/week
   */
  const copyTask = useCallback(async (taskId: string, targetWeek?: number, targetDay?: number) => {
    try {
      setIsSaving(true);
      
      const payload: CopyTaskCommand = {
        week_number: targetWeek,
        due_day: targetDay,
      };

      const response = await fetch(`/api/v1/tasks/${taskId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to copy task');
      }

      // If copied to current day, refetch
      if ((targetWeek === weekNumber || !targetWeek) && (targetDay === dayNumber || !targetDay)) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error copying task:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [weekNumber, dayNumber, fetchData]);

  /**
   * Move task to another day/week
   */
  const moveTask = useCallback(async (taskId: string, targetWeek?: number, targetDay?: number) => {
    const previousData = { ...data };

    // Optimistically remove from current view if moving to different day
    if (targetWeek !== weekNumber || targetDay !== dayNumber) {
      setData(prev => ({
        ...prev,
        slots: {
          mostImportant: prev.slots.mostImportant?.id === taskId ? null : prev.slots.mostImportant,
          secondary: prev.slots.secondary.filter(t => t.id !== taskId),
          additional: prev.slots.additional.filter(t => t.id !== taskId),
        },
      }));
    }

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          week_number: targetWeek,
          due_day: targetDay,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move task');
      }

      // If moved within current day, refetch
      if (targetWeek === weekNumber && targetDay === dayNumber) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error moving task:', err);
      // Rollback if moved away but failed
      setData(previousData);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, weekNumber, dayNumber, fetchData]);

  return {
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
    refetch: fetchData,
  };
}

