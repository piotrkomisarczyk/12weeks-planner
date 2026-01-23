/**
 * useWeekPlan Hook
 * 
 * Manages state and data fetching for the Week Planning view.
 * Handles weekly goals, tasks, and provides CRUD operations with optimistic updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  WeekViewData,
  WeekViewMeta,
  WeeklyGoalViewModel,
  TaskViewModel,
  CreateWeeklyGoalCommand,
  UpdateWeeklyGoalCommand,
  CreateTaskCommand,
  UpdateTaskCommand,
} from '@/types';

type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseWeekPlanReturn {
  data: WeekViewData;
  meta: WeekViewMeta;
  status: LoadingStatus;
  error: string | null;
  
  // Weekly Goal Actions
  addWeeklyGoal: (title: string, longTermGoalId?: string, milestoneId?: string) => Promise<void>;
  updateWeeklyGoal: (id: string, updates: Partial<UpdateWeeklyGoalCommand>) => Promise<void>;
  deleteWeeklyGoal: (id: string) => Promise<void>;
  reorderWeeklyGoals: (newOrder: WeeklyGoalViewModel[]) => Promise<void>;
  moveWeeklyGoalUp: (id: string) => Promise<void>;
  moveWeeklyGoalDown: (id: string) => Promise<void>;
  
  // Task Actions
  addTask: (weeklyGoalId: string | null, title: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<UpdateTaskCommand>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (
    taskId: string,
    sourceContainerId: string | null,
    destContainerId: string | null,
    newIndex: number
  ) => Promise<void>;
  
  // Utility
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing week planning data and operations
 * 
 * @param planId - UUID of the plan
 * @param weekNumber - Week number (1-12)
 * @returns Hook interface with data, status, and action functions
 */
export function useWeekPlan(planId: string, weekNumber: number): UseWeekPlanReturn {
  const [data, setData] = useState<WeekViewData>({
    weeklyGoals: [],
    adHocTasks: [],
  });
  
  const [meta, setMeta] = useState<WeekViewMeta>({
    longTermGoals: [],
    milestones: [],
  });
  
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all data for the week view
   */
  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // Fetch all data in parallel
      const [weeklyGoalsRes, tasksRes, goalsRes, milestonesRes] = await Promise.all([
        fetch(`/api/v1/weekly-goals?plan_id=${planId}&week_number=${weekNumber}`),
        fetch(`/api/v1/tasks?plan_id=${planId}&week_number=${weekNumber}`),
        fetch(`/api/v1/plans/${planId}/goals`),
        // Fetch all milestones - will be filtered client-side by plan's goals
        fetch(`/api/v1/milestones`),
      ]);

      // Check for errors
      if (!weeklyGoalsRes.ok || !tasksRes.ok || !goalsRes.ok || !milestonesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      // Parse responses
      const weeklyGoalsData = await weeklyGoalsRes.json();
      const tasksData = await tasksRes.json();
      const goalsData = await goalsRes.json();
      const milestonesData = await milestonesRes.json();

      // Extract arrays from responses
      const weeklyGoals = weeklyGoalsData.data || [];
      const allTasks = tasksData.data || [];
      const longTermGoals = goalsData.data || [];
      const allMilestones = milestonesData.data || [];
      
      // Filter milestones to only include those belonging to this plan's goals
      const goalIds = new Set(longTermGoals.map((g: any) => g.id));
      const milestones = allMilestones.filter((m: any) => goalIds.has(m.long_term_goal_id));

      // Separate tasks into weekly goal subtasks and ad-hoc tasks
      const tasksByGoal = new Map<string, TaskViewModel[]>();
      const adHocTasks: TaskViewModel[] = [];

      allTasks.forEach((task: TaskViewModel) => {
        if (task.weekly_goal_id) {
          // Task belongs to a weekly goal
          const existing = tasksByGoal.get(task.weekly_goal_id) || [];
          tasksByGoal.set(task.weekly_goal_id, [...existing, task]);
        } else if (task.task_type === 'ad_hoc') {
          // Ad-hoc task
          adHocTasks.push(task);
        }
      });

      // Build weekly goal view models with nested tasks
      const weeklyGoalViewModels: WeeklyGoalViewModel[] = weeklyGoals.map((goal: any) => ({
        ...goal,
        tasks: (tasksByGoal.get(goal.id) || []).sort((a, b) => a.position - b.position),
      }));

      // Sort by position
      weeklyGoalViewModels.sort((a, b) => a.position - b.position);
      adHocTasks.sort((a, b) => a.position - b.position);

      // Set data
      setData({
        weeklyGoals: weeklyGoalViewModels,
        adHocTasks,
      });

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
      });

      setStatus('success');
    } catch (err) {
      console.error('Error fetching week plan data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    }
  }, [planId, weekNumber]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Add a new weekly goal
   */
  const addWeeklyGoal = useCallback(async (title: string, longTermGoalId?: string, milestoneId?: string) => {
    // Calculate next position
    const nextPosition = data.weeklyGoals.length + 1;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticGoal: WeeklyGoalViewModel = {
      id: tempId,
      plan_id: planId,
      long_term_goal_id: longTermGoalId || null,
      milestone_id: milestoneId || null,
      week_number: weekNumber,
      title,
      description: null,
      position: nextPosition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [],
    };

    setData(prev => ({
      ...prev,
      weeklyGoals: [...prev.weeklyGoals, optimisticGoal],
    }));

    try {
      const payload: CreateWeeklyGoalCommand = {
        plan_id: planId,
        long_term_goal_id: longTermGoalId || null,
        milestone_id: milestoneId || null,
        week_number: weekNumber,
        title,
        description: null,
        position: nextPosition,
      };

      const response = await fetch('/api/v1/weekly-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If validation failed, show specific validation messages
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const messages = errorData.details.map((detail: any) => detail.message).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to create weekly goal');
      }

      const result = await response.json();
      const newGoal = result.data;

      // Replace optimistic update with real data
      setData(prev => ({
        ...prev,
        weeklyGoals: prev.weeklyGoals.map(g =>
          g.id === tempId ? { ...newGoal, tasks: [] } : g
        ),
      }));
    } catch (err) {
      console.error('Error creating weekly goal:', err);
      // Rollback optimistic update
      setData(prev => ({
        ...prev,
        weeklyGoals: prev.weeklyGoals.filter(g => g.id !== tempId),
      }));
      throw err;
    }
  }, [data.weeklyGoals, planId, weekNumber]);

  /**
   * Update a weekly goal
   */
  const updateWeeklyGoal = useCallback(async (
    id: string,
    updates: Partial<UpdateWeeklyGoalCommand>
  ) => {
    // Optimistic update
    const previousData = { ...data };
    setData(prev => ({
      ...prev,
      weeklyGoals: prev.weeklyGoals.map(g =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));

    try {
      const response = await fetch(`/api/v1/weekly-goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update weekly goal');
      }

      const result = await response.json();
      const updatedGoal = result.data;

      // Update with real data
      setData(prev => ({
        ...prev,
        weeklyGoals: prev.weeklyGoals.map(g =>
          g.id === id ? { ...g, ...updatedGoal } : g
        ),
      }));
    } catch (err) {
      console.error('Error updating weekly goal:', err);
      // Rollback
      setData(previousData);
      throw err;
    }
  }, [data]);

  /**
   * Delete a weekly goal
   */
  const deleteWeeklyGoal = useCallback(async (id: string) => {
    // Optimistic update
    const previousData = { ...data };
    setData(prev => ({
      ...prev,
      weeklyGoals: prev.weeklyGoals.filter(g => g.id !== id),
    }));

    try {
      const response = await fetch(`/api/v1/weekly-goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete weekly goal');
      }
    } catch (err) {
      console.error('Error deleting weekly goal:', err);
      // Rollback
      setData(previousData);
      throw err;
    }
  }, [data]);

  /**
   * Reorder weekly goals
   */
  const reorderWeeklyGoals = useCallback(async (newOrder: WeeklyGoalViewModel[]) => {
    const previousData = { ...data };
    
    // Update positions
    const goalsWithNewPositions = newOrder.map((goal, index) => ({
      ...goal,
      position: index + 1,
    }));

    setData(prev => ({
      ...prev,
      weeklyGoals: goalsWithNewPositions,
    }));

    try {
      // Update each goal's position
      await Promise.all(
        goalsWithNewPositions.map(goal =>
          fetch(`/api/v1/weekly-goals/${goal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: goal.position }),
          })
        )
      );
    } catch (err) {
      console.error('Error reordering weekly goals:', err);
      // Rollback
      setData(previousData);
      throw err;
    }
  }, [data]);

  /**
   * Move a weekly goal up (decrease position)
   */
  const moveWeeklyGoalUp = useCallback(async (id: string) => {
    const currentIndex = data.weeklyGoals.findIndex(g => g.id === id);
    
    // Can't move up if already at the top
    if (currentIndex <= 0) return;

    const previousData = { ...data };
    const newOrder = [...data.weeklyGoals];
    
    // Swap with previous goal
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

    try {
      await reorderWeeklyGoals(newOrder);
      // Refetch to ensure consistency
      await fetchData();
    } catch (err) {
      console.error('Error moving weekly goal up:', err);
      setData(previousData);
      throw err;
    }
  }, [data, reorderWeeklyGoals, fetchData]);

  /**
   * Move a weekly goal down (increase position)
   */
  const moveWeeklyGoalDown = useCallback(async (id: string) => {
    const currentIndex = data.weeklyGoals.findIndex(g => g.id === id);
    
    // Can't move down if already at the bottom
    if (currentIndex < 0 || currentIndex >= data.weeklyGoals.length - 1) return;

    const previousData = { ...data };
    const newOrder = [...data.weeklyGoals];
    
    // Swap with next goal
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

    try {
      await reorderWeeklyGoals(newOrder);
      // Refetch to ensure consistency
      await fetchData();
    } catch (err) {
      console.error('Error moving weekly goal down:', err);
      setData(previousData);
      throw err;
    }
  }, [data, reorderWeeklyGoals, fetchData]);

  /**
   * Add a new task
   * If adding to a weekly goal, inherits long_term_goal_id and milestone_id from parent
   */
  const addTask = useCallback(async (weeklyGoalId: string | null, title: string) => {
    // Determine position based on container
    let nextPosition = 1;
    let inheritedGoalId: string | null = null;
    let inheritedMilestoneId: string | null = null;
    
    if (weeklyGoalId) {
      const goal = data.weeklyGoals.find(g => g.id === weeklyGoalId);
      nextPosition = (goal?.tasks.length || 0) + 1;
      // Inherit goal and milestone associations from weekly goal
      inheritedGoalId = goal?.long_term_goal_id || null;
      inheritedMilestoneId = goal?.milestone_id || null;
    } else {
      nextPosition = data.adHocTasks.length + 1;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: TaskViewModel = {
      id: tempId,
      plan_id: planId,
      weekly_goal_id: weeklyGoalId,
      long_term_goal_id: inheritedGoalId,
      milestone_id: inheritedMilestoneId,
      title,
      description: null,
      priority: 'C',
      status: 'todo',
      task_type: weeklyGoalId ? 'weekly_sub' : 'ad_hoc',
      week_number: weekNumber,
      due_day: null,
      position: nextPosition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (weeklyGoalId) {
      setData(prev => ({
        ...prev,
        weeklyGoals: prev.weeklyGoals.map(g =>
          g.id === weeklyGoalId
            ? { ...g, tasks: [...g.tasks, optimisticTask] }
            : g
        ),
      }));
    } else {
      setData(prev => ({
        ...prev,
        adHocTasks: [...prev.adHocTasks, optimisticTask],
      }));
    }

    try {
      const payload: CreateTaskCommand = {
        plan_id: planId,
        weekly_goal_id: weeklyGoalId,
        long_term_goal_id: inheritedGoalId,
        milestone_id: inheritedMilestoneId,
        title,
        description: null,
        priority: 'C',
        status: 'todo',
        task_type: weeklyGoalId ? 'weekly_sub' : 'ad_hoc',
        week_number: weekNumber,
        due_day: null,
        position: nextPosition,
      };

      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If validation failed, show specific validation messages
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const messages = errorData.details.map((detail: any) => detail.message).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json();
      const newTask = result.data;

      // Replace optimistic update with real data
      if (weeklyGoalId) {
        setData(prev => ({
          ...prev,
          weeklyGoals: prev.weeklyGoals.map(g =>
            g.id === weeklyGoalId
              ? { ...g, tasks: g.tasks.map(t => t.id === tempId ? newTask : t) }
              : g
          ),
        }));
      } else {
        setData(prev => ({
          ...prev,
          adHocTasks: prev.adHocTasks.map(t => t.id === tempId ? newTask : t),
        }));
      }
    } catch (err) {
      console.error('Error creating task:', err);
      // Rollback optimistic update
      if (weeklyGoalId) {
        setData(prev => ({
          ...prev,
          weeklyGoals: prev.weeklyGoals.map(g =>
            g.id === weeklyGoalId
              ? { ...g, tasks: g.tasks.filter(t => t.id !== tempId) }
              : g
          ),
        }));
      } else {
        setData(prev => ({
          ...prev,
          adHocTasks: prev.adHocTasks.filter(t => t.id !== tempId),
        }));
      }
      throw err;
    }
  }, [data, planId, weekNumber]);

  /**
   * Update a task
   */
  const updateTask = useCallback(async (id: string, updates: Partial<UpdateTaskCommand>) => {
    const previousData = { ...data };

    // Apply optimistic update
    const updateInGoals = (goals: WeeklyGoalViewModel[]) =>
      goals.map(g => ({
        ...g,
        tasks: g.tasks.map(t => (t.id === id ? { ...t, ...updates } as TaskViewModel : t)),
      }));

    const updateInAdHoc = (tasks: TaskViewModel[]) =>
      tasks.map(t => (t.id === id ? { ...t, ...updates } as TaskViewModel : t));

    setData(prev => ({
      ...prev,
      weeklyGoals: updateInGoals(prev.weeklyGoals),
      adHocTasks: updateInAdHoc(prev.adHocTasks),
    }));

    try {
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If validation failed, show specific validation messages
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          const messages = errorData.details.map((detail: any) => detail.message).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorData.error || 'Failed to update task');
      }

      const result = await response.json();
      const updatedTask = result.data;

      // Update with real data
      setData(prev => ({
        ...prev,
        weeklyGoals: prev.weeklyGoals.map(g => ({
          ...g,
          tasks: g.tasks.map(t => (t.id === id ? updatedTask : t)),
        })),
        adHocTasks: prev.adHocTasks.map(t => (t.id === id ? updatedTask : t)),
      }));
    } catch (err) {
      console.error('Error updating task:', err);
      // Rollback
      setData(previousData);
      throw err;
    }
  }, [data]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string) => {
    const previousData = { ...data };

    // Optimistic update
    setData(prev => ({
      ...prev,
      weeklyGoals: prev.weeklyGoals.map(g => ({
        ...g,
        tasks: g.tasks.filter(t => t.id !== id),
      })),
      adHocTasks: prev.adHocTasks.filter(t => t.id !== id),
    }));

    try {
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
    }
  }, [data]);

  /**
   * Move a task between containers or reorder within a container
   */
  const moveTask = useCallback(async (
    taskId: string,
    sourceContainerId: string | null,
    destContainerId: string | null,
    newIndex: number
  ) => {
    const previousData = { ...data };

    // Find the task
    let task: TaskViewModel | undefined;
    if (sourceContainerId) {
      const sourceGoal = data.weeklyGoals.find(g => g.id === sourceContainerId);
      task = sourceGoal?.tasks.find(t => t.id === taskId);
    } else {
      task = data.adHocTasks.find(t => t.id === taskId);
    }

    if (!task) return;

    // Remove from source
    let newWeeklyGoals = data.weeklyGoals;
    let newAdHocTasks = data.adHocTasks;

    if (sourceContainerId) {
      newWeeklyGoals = newWeeklyGoals.map(g =>
        g.id === sourceContainerId
          ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) }
          : g
      );
    } else {
      newAdHocTasks = newAdHocTasks.filter(t => t.id !== taskId);
    }

    // Update task properties based on destination
    const movedTask: TaskViewModel = {
      ...task,
      weekly_goal_id: destContainerId,
      task_type: destContainerId ? 'weekly_sub' : 'ad_hoc',
      position: newIndex + 1,
    };

    // Insert into destination
    if (destContainerId) {
      newWeeklyGoals = newWeeklyGoals.map(g => {
        if (g.id === destContainerId) {
          const newTasks = [...g.tasks];
          newTasks.splice(newIndex, 0, movedTask);
          // Update positions
          return {
            ...g,
            tasks: newTasks.map((t, i) => ({ ...t, position: i + 1 })),
          };
        }
        return g;
      });
    } else {
      newAdHocTasks.splice(newIndex, 0, movedTask);
      newAdHocTasks = newAdHocTasks.map((t, i) => ({ ...t, position: i + 1 }));
    }

    // Apply optimistic update
    setData({
      weeklyGoals: newWeeklyGoals,
      adHocTasks: newAdHocTasks,
    });

    try {
      // Update task in backend
      await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_goal_id: destContainerId,
          task_type: destContainerId ? 'weekly_sub' : 'ad_hoc',
          position: newIndex + 1,
        }),
      });

      // Update positions for other tasks in destination
      const tasksToUpdate = destContainerId
        ? newWeeklyGoals.find(g => g.id === destContainerId)?.tasks || []
        : newAdHocTasks;

      await Promise.all(
        tasksToUpdate
          .filter(t => t.id !== taskId)
          .map(t =>
            fetch(`/api/v1/tasks/${t.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: t.position }),
            })
          )
      );
    } catch (err) {
      console.error('Error moving task:', err);
      // Rollback
      setData(previousData);
      throw err;
    }
  }, [data]);

  return {
    data,
    meta,
    status,
    error,
    addWeeklyGoal,
    updateWeeklyGoal,
    deleteWeeklyGoal,
    reorderWeeklyGoals,
    moveWeeklyGoalUp,
    moveWeeklyGoalDown,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch: fetchData,
  };
}

